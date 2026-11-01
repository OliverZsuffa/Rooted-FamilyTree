import { useCallback, useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import {
  applyNodeChanges, Background, Controls, ReactFlow, type Edge, type Node, type NodeChange, type NodeProps,
  Handle, Position, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Check, Download, LayoutGrid, Plus, Redo2, Search, Sprout, Trash2, Undo2, Upload, X } from 'lucide-react';
import { createEmptyProject, type ParentageType, type Person, type Project } from './domain/schema';
import { calculateGenerations, validateParentage } from './domain/relationships';
import { buildRelationshipEdges } from './domain/relationshipEdges';
import { calculateAutoPositions, createFallbackPositions } from './domain/layout';
import { loadProject, saveProject } from './data/database';
import { validateProjectForImport } from './domain/projectValidation';
import { useRegisterSW } from 'virtual:pwa-register/react';

type PersonNodeData = {
  person: Person;
  selected: boolean;
  dimmed: boolean;
};
type AttributeRow = { key: string; value: string; type: 'text' | 'number' | 'date' | 'boolean' };
type EditingRelationship = { id: string; kind: 'parentage' | 'partnership' } | null;
type PersonFlowNode = Node<PersonNodeData, 'person'>;
type JunctionFlowNode = Node<{ symbol: string; dimmed: boolean }, 'junction'>;
type FlowNode = PersonFlowNode | JunctionFlowNode;

function PersonCard({ data }: NodeProps<PersonFlowNode>) {
  const date = data.person.birthDate ? new Date(data.person.birthDate).getFullYear() : null;
  const death = data.person.deathDate ? new Date(data.person.deathDate).getFullYear() : null;
  const detail = data.person.displayAttribute ? data.person.attributes[data.person.displayAttribute] : null;
  return (
    <div
      className={data.dimmed ? (data.selected ? 'person-card person-card-selected person-card-dimmed' : 'person-card person-card-dimmed') : (data.selected ? 'person-card person-card-selected' : 'person-card')}
    >
      <Handle type="target" position={Position.Top} />
      <div className="person-card-name">{data.person.name || 'Unnamed person'}</div>
      {(date || death) && <div className="person-card-dates">{date ?? '?'}{death ? ` · ${death}` : ''}</div>}
      {detail !== null && detail !== undefined && <div className="person-card-detail">{String(detail)}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
function JunctionCard({ data }: NodeProps<JunctionFlowNode>) {
  return (
    <div className={data.dimmed ? 'partnership-junction partnership-junction-dimmed' : 'partnership-junction'} aria-label="Partnership">
      <Handle type="target" position={Position.Top} />
      <span>{data.symbol}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { person: PersonCard, junction: JunctionCard };
const parentageTypes: { value: ParentageType; label: string }[] = [
  { value: 'biological_parent', label: 'Biological parent' },
  { value: 'adoptive_parent', label: 'Adoptive parent' },
  { value: 'step_parent', label: 'Step parent' },
  { value: 'guardian', label: 'Guardian' },
];

function syncGenerationRows(project: Project): Project {
  const result = calculateGenerations(project);
  if (!result.ok) return project;
  const people = new Set(project.people.map((person) => person.id));
  const manualPositions = Object.fromEntries(
    Object.entries(project.layout.manualPositions)
      .filter(([id]) => people.has(id))
      .map(([id, position]) => [id, { x: position.x, y: (result.generations.get(id) ?? 0) * 190 }]),
  );
  return { ...project, layout: { manualPositions } };
}


function App() {
  const [project, setProject] = useState<Project | null>(null);
  const projectRef = useRef<Project | null>(null);
  const dragStart = useRef<{ project: Project; id: string; position: { x: number; y: number } } | null>(null);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const reactFlowInstance = useRef<ReactFlowInstance<FlowNode, Edge> | null>(null);
  const lastFittedStructure = useRef('');
  const [history, setHistory] = useState<{ past: Project[]; future: Project[] }>({ past: [], future: [] });
  const [autoLayout, setAutoLayout] = useState<{ key: string; positions: Record<string, { x: number; y: number }> }>({ key: '', positions: {} });
  const [storageReady, setStorageReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'person' | 'relationship' | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personName, setPersonName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([]);
  const [displayAttribute, setDisplayAttribute] = useState('');
  const [attributeError, setAttributeError] = useState('');
  const [relationType, setRelationType] = useState<ParentageType | 'marriage' | 'partnership'>('biological_parent');
  const [partnershipStartDate, setPartnershipStartDate] = useState('');
  const [partnershipEndDate, setPartnershipEndDate] = useState('');
  const [relationPersonId, setRelationPersonId] = useState('');
  const [newRelativeName, setNewRelativeName] = useState('');
  const [relationDirection, setRelationDirection] = useState<'parent' | 'child'>('child');
  const [relationError, setRelationError] = useState('');
  const [editingRelation, setEditingRelation] = useState<EditingRelationship>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const [needRefresh, setNeedRefresh] = useState(false);
  const { updateServiceWorker } = useRegisterSW({ immediate: true, onNeedRefresh: () => setNeedRefresh(true) });

  const commitProject = useCallback((next: Project | ((current: Project) => Project), recordHistory = true) => {
    const current = projectRef.current;
    if (!current) return;
    const updated = typeof next === 'function' ? next(current) : next;
    if (updated === current) return;
    if (recordHistory) setHistory((state) => ({ past: [...state.past, current].slice(-50), future: [] }));
    projectRef.current = updated;
    setProject(updated);
  }, []);

  const undo = () => {
    const current = projectRef.current;
    setHistory((state) => {
      if (!current || !state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      projectRef.current = previous;
      setProject(previous);
      return { past: state.past.slice(0, -1), future: [current, ...state.future] };
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        const current = projectRef.current;
        setHistory((state) => {
          if (!current || !state.past.length) return state;
          const previous = state.past[state.past.length - 1];
          projectRef.current = previous;
          setProject(previous);
          return { past: state.past.slice(0, -1), future: [current, ...state.future] };
        });
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        const current = projectRef.current;
        setHistory((state) => {
          if (!state.future.length) return state;
          const next = state.future[0];
          projectRef.current = next;
          setProject(next);
          return { past: [...state.past, ...(current ? [current] : [])].slice(-50), future: state.future.slice(1) };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const redo = () => {
    const current = projectRef.current;
    setHistory((state) => {
      if (!state.future.length) return state;
      const next = state.future[0];
      projectRef.current = next;
      setProject(next);
      return { past: [...state.past, ...(current ? [current] : [])].slice(-50), future: state.future.slice(1) };
    });
  };

  useEffect(() => {
    let active = true;
    loadProject().then((saved) => {
      if (!active) return;
      const initial = saved ?? createEmptyProject();
      projectRef.current = initial;
      setProject(initial);
      setLoadFailed(false);
      setStorageReady(true);
      setSaveState('saved');
    }).catch(() => {
      if (!active) return;
      const initial = createEmptyProject();
      projectRef.current = initial;
      setProject(initial);
      setLoadFailed(true);
      setStorageReady(false);
      setSaveState('error');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!project || !storageReady) return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      saveProject(project).then(() => setSaveState('saved')).catch(() => setSaveState('error'));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [project, storageReady]);

  const layoutKey = useMemo(() => project ? [
    project.id,
    ...project.people.map((person) => person.id).sort(),
    '|',
    ...project.parentage.map((relation) => `${relation.id}:${relation.parentId}:${relation.childId}:${relation.type}`).sort(),
  ].join('|') : '', [project?.id, project?.people, project?.parentage]);

  useEffect(() => {
    if (!project) return;
    let active = true;
    const fallback = createFallbackPositions(project);
    setAutoLayout({ key: layoutKey, positions: fallback });
    if (!project.people.length) return () => { active = false; };
    calculateAutoPositions(project).then((positions) => {
      if (active) setAutoLayout({ key: layoutKey, positions: { ...fallback, ...positions } });
    }).catch(() => {
      if (active) setAutoLayout({ key: layoutKey, positions: fallback });
    });
    return () => { active = false; };
  }, [layoutKey]);

  useEffect(() => {
    if (!project || !reactFlowInstance.current) return;
    const structureKey = [
      ...project.people.map((person) => person.id).sort(),
      '|',
      ...project.parentage.map((relation) => relation.id).sort(),
      '|',
      ...project.partnerships.map((partnership) => partnership.id).sort(),
    ].join('|');
    if (structureKey === lastFittedStructure.current) return;
    lastFittedStructure.current = structureKey;
    const frame = window.requestAnimationFrame(() => {
      reactFlowInstance.current?.fitView({ padding: 0.25, duration: 220 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [project?.people, project?.parentage, project?.partnerships]);

  useEffect(() => {
    if (selectedId && search && !project?.people.some((person) => person.id === selectedId && person.name.toLowerCase().includes(search.toLowerCase()))) setSelectedId(null);
  }, [selectedId, search, project?.people]);

  const selectedPerson = project?.people.find((person) => person.id === selectedId) ?? null;
  const generations = useMemo(() => project ? calculateGenerations(project) : null, [project]);
  const highlightedIds = useMemo(() => {
    const highlighted = new Set<string>();
    if (!project || !selectedId) return highlighted;
    const ancestors = [selectedId];
    while (ancestors.length) {
      const current = ancestors.pop()!;
      if (highlighted.has(current)) continue;
      highlighted.add(current);
      for (const relation of project.parentage) {
        if (relation.childId === current && !highlighted.has(relation.parentId)) ancestors.push(relation.parentId);
      }
    }
    const descendants = [selectedId];
    while (descendants.length) {
      const current = descendants.pop()!;
      if (highlighted.has(current) && current !== selectedId) continue;
      highlighted.add(current);
      for (const relation of project.parentage) {
        if (relation.parentId === current && !highlighted.has(relation.childId)) descendants.push(relation.childId);
      }
    }
    const directParentIds = new Set(project.parentage.filter((relation) => relation.childId === selectedId).map((relation) => relation.parentId));
    for (const relation of project.parentage) {
      if (directParentIds.has(relation.parentId)) highlighted.add(relation.childId);
    }
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const partnership of project.partnerships) {
        if (highlighted.has(partnership.person1Id) && !highlighted.has(partnership.person2Id)) { highlighted.add(partnership.person2Id); expanded = true; }
        if (highlighted.has(partnership.person2Id) && !highlighted.has(partnership.person1Id)) { highlighted.add(partnership.person1Id); expanded = true; }
      }
    }
    return highlighted;
  }, [project, selectedId]);

  const nodes = useMemo<FlowNode[]>(() => {
    if (!project) return [];
    const automatic = autoLayout.key === layoutKey ? autoLayout.positions : createFallbackPositions(project);
    const visiblePeople = project.people.filter((person) => !search || person.name.toLowerCase().includes(search.toLowerCase()));
    const visibleIds = new Set(visiblePeople.map((person) => person.id));
    const personNodes: PersonFlowNode[] = visiblePeople.map((person) => ({
      id: person.id, type: 'person',
      position: project.layout.manualPositions[person.id] ?? automatic[person.id] ?? { x: 0, y: 0 },
      data: {
        person,
        selected: person.id === selectedId,
        dimmed: !!selectedId && !highlightedIds.has(person.id),
      },
    }));
    const junctionNodes: JunctionFlowNode[] = [];
    for (const partnership of project.partnerships) {
      const sharedChildren = project.parentage.filter((relation) => relation.parentId === partnership.person1Id
        && project.parentage.some((other) => other.childId === relation.childId && other.parentId === partnership.person2Id));
      if (!sharedChildren.some((child) => visibleIds.has(child.childId)) || !visibleIds.has(partnership.person1Id) || !visibleIds.has(partnership.person2Id)) continue;
      const first = project.layout.manualPositions[partnership.person1Id] ?? automatic[partnership.person1Id] ?? { x: 0, y: 0 };
      const second = project.layout.manualPositions[partnership.person2Id] ?? automatic[partnership.person2Id] ?? { x: 0, y: 0 };
      junctionNodes.push({
        id: 'junction:' + partnership.id, type: 'junction',
        position: { x: (first.x + second.x) / 2 + 76, y: (first.y + second.y) / 2 + 95 },
        data: { symbol: partnership.type === 'marriage' ? '♥' : '♡', dimmed: !!selectedId && !highlightedIds.has(partnership.person1Id) && !highlightedIds.has(partnership.person2Id) },
        draggable: false, selectable: false,
      });
    }
    return [...personNodes, ...junctionNodes];
  }, [project, selectedId, search, autoLayout, layoutKey, highlightedIds]);
  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes]);

  const edges = useMemo<Edge[]>(() => {
    if (!project) return [];
    return buildRelationshipEdges(project, nodes.map((node) => node.id), selectedId, highlightedIds);
  }, [project, nodes, selectedId, highlightedIds]);

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rooted-family-tree.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importProject = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = validateProjectForImport(JSON.parse(await file.text()));
      if (!parsed.success) {
        window.alert(parsed.error + ' Your current tree has not been changed.');
        return;
      }
      if (window.confirm('Replace your current family tree with this backup?')) {
        commitProject(syncGenerationRows(parsed.project));
        setSelectedId(null);
        setSearch('');
      }
    } catch {
      window.alert('The backup could not be read. Your current tree has not been changed.');
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };

  const openPerson = (person?: Person) => {
    setEditingPerson(person ?? null);
    setPersonName(person?.name ?? '');
    setBirthDate(person?.birthDate ?? '');
    setDeathDate(person?.deathDate ?? '');
    setAttributeRows(person ? Object.entries(person.attributes).map(([key, value]) => ({ key, value: value === null ? '' : String(value), type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'text' })) : []);
    setDisplayAttribute(person?.displayAttribute ?? '');
    setAttributeError('');
    setDialog('person');
  };

  const savePerson = (event: FormEvent) => {
    event.preventDefault();
    if (!project || !personName.trim()) return;
    if (birthDate && deathDate && deathDate < birthDate) { setAttributeError('Death date cannot be before birth date.'); return; }
    const attributes: Record<string, string | number | boolean | null> = {};
    for (const row of attributeRows) {
      const key = row.key.trim();
      if (!key) continue;
      if (Object.prototype.hasOwnProperty.call(attributes, key)) { setAttributeError('Each detail needs a unique name.'); return; }
      if (row.type === 'number') {
        if (!row.value.trim()) attributes[key] = null;
        else if (Number.isFinite(Number(row.value))) attributes[key] = Number(row.value);
        else { setAttributeError('Enter a valid number for ' + key + '.'); return; }
      } else if (row.type === 'boolean') attributes[key] = row.value === 'true';
      else attributes[key] = row.value;
    }
    const selectedDisplayAttribute = displayAttribute && Object.prototype.hasOwnProperty.call(attributes, displayAttribute) ? displayAttribute : null;
    if (editingPerson) {
      commitProject({ ...project, people: project.people.map((person) => person.id === editingPerson.id
        ? { ...person, name: personName.trim(), birthDate: birthDate || null, deathDate: deathDate || null, attributes, displayAttribute: selectedDisplayAttribute }
        : person) });
      setSelectedId(editingPerson.id);
    } else {
      const person: Person = { id: crypto.randomUUID(), name: personName.trim(), birthDate: birthDate || null, deathDate: deathDate || null, attributes, displayAttribute: selectedDisplayAttribute };
      commitProject({ ...project, people: [...project.people, person] });
      setSelectedId(person.id);
    }
    setDialog(null);
    setAttributeError('');
  };

  const updateAttributeRow = (index: number, field: keyof AttributeRow, value: string) => {
    setAttributeRows((rows) => rows.map((row, rowIndex) => rowIndex === index
      ? { ...row, [field]: value, ...(field === 'type' && value === 'boolean' && !row.value ? { value: 'true' } : {}) }
      : row));
  };

  const saveRelationship = (event: FormEvent) => {
    event.preventDefault();
    if (!project || !selectedPerson || !relationPersonId) return;
    if (relationPersonId === '__new__' && !newRelativeName.trim()) { setRelationError('Enter the new person’s name.'); return; }
    const newRelative = relationPersonId === '__new__'
      ? { id: crypto.randomUUID(), name: newRelativeName.trim(), birthDate: null, deathDate: null, attributes: {}, displayAttribute: null }
      : null;
    const otherPersonId = newRelative?.id ?? relationPersonId;
    const baseProject = newRelative ? { ...project, people: [...project.people, newRelative] } : project;
    if (relationType === 'marriage' || relationType === 'partnership') {
      if (partnershipStartDate && partnershipEndDate && partnershipEndDate < partnershipStartDate) {
        setRelationError('The end date cannot be before the start date.');
        return;
      }
      const partnership = {
        id: editingRelation?.kind === 'partnership' ? editingRelation.id : crypto.randomUUID(),
        type: relationType, person1Id: selectedPerson.id, person2Id: otherPersonId,
        startDate: partnershipStartDate || null, endDate: partnershipEndDate || null,
      };
      const partnerships = editingRelation?.kind === 'partnership'
        ? baseProject.partnerships.map((item) => item.id === editingRelation.id ? partnership : item)
        : [...baseProject.partnerships, partnership];
      commitProject({ ...baseProject, partnerships });
      setDialog(null);
      setEditingRelation(null);
      setRelationError('');
      return;
    }
    const relation = {
      id: editingRelation?.kind === 'parentage' ? editingRelation.id : crypto.randomUUID(),
      type: relationType,
      parentId: relationDirection === 'child' ? selectedPerson.id : otherPersonId,
      childId: relationDirection === 'child' ? otherPersonId : selectedPerson.id,
    };
    const validationProject = editingRelation?.kind === 'parentage'
      ? { ...baseProject, parentage: baseProject.parentage.filter((item) => item.id !== editingRelation.id) }
      : baseProject;
    const error = validateParentage(validationProject, relation);
    if (error) { setRelationError(error); return; }
    const parentage = [...validationProject.parentage, relation];
    commitProject(syncGenerationRows({ ...baseProject, parentage }));
    setDialog(null);
    setEditingRelation(null);
    setRelationError('');
  };

  const editParentage = (relation: Project['parentage'][number]) => {
    if (!selectedPerson) return;
    setEditingRelation({ id: relation.id, kind: 'parentage' });
    setRelationType(relation.type);
    setRelationPersonId(relation.parentId === selectedPerson.id ? relation.childId : relation.parentId);
    setRelationDirection(relation.parentId === selectedPerson.id ? 'child' : 'parent');
    setRelationError('');
    setDialog('relationship');
  };

  const editPartnership = (relation: Project['partnerships'][number]) => {
    if (!selectedPerson) return;
    setEditingRelation({ id: relation.id, kind: 'partnership' });
    setRelationType(relation.type);
    setRelationPersonId(relation.person1Id === selectedPerson.id ? relation.person2Id : relation.person1Id);
    setPartnershipStartDate(relation.startDate ?? '');
    setPartnershipEndDate(relation.endDate ?? '');
    setRelationError('');
    setDialog('relationship');
  };

  const removeParentage = (id: string) => {
    if (!project || !window.confirm('Remove this family relationship?')) return;
    commitProject(syncGenerationRows({ ...project, parentage: project.parentage.filter((item) => item.id !== id) }));
  };

  const removePartnership = (id: string) => {
    if (!project || !window.confirm('Remove this partnership?')) return;
    commitProject({ ...project, partnerships: project.partnerships.filter((item) => item.id !== id) });
  };

  const deletePerson = () => {
    if (!project || !selectedPerson || !window.confirm(`Delete ${selectedPerson.name || 'this person'} and their relationships?`)) return;
    const id = selectedPerson.id;
    commitProject(syncGenerationRows({
      ...project,
      people: project.people.filter((person) => person.id !== id),
      parentage: project.parentage.filter((item) => item.parentId !== id && item.childId !== id),
      partnerships: project.partnerships.filter((item) => item.person1Id !== id && item.person2Id !== id),
      layout: { manualPositions: Object.fromEntries(Object.entries(project.layout.manualPositions).filter(([key]) => key !== id)) },
    }));
    setSelectedId(null);
  };

  const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    setFlowNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onNodeDragStart = useCallback((_event: MouseEvent | TouchEvent, node: FlowNode) => {
    const current = projectRef.current;
    if (!current || node.type !== 'person') return;
    dragStart.current = { project: current, id: node.id, position: { ...node.position } };
  }, []);

  const onNodeDragStop = useCallback((_event: MouseEvent | TouchEvent, node: FlowNode) => {
    const start = dragStart.current;
    dragStart.current = null;
    const current = projectRef.current;
    if (!start || !current || node.type !== 'person' || start.id !== node.id) return;
    if (start.position.x === node.position.x && start.position.y === node.position.y) return;

    const result = calculateGenerations(current);
    if (!result.ok) return;
    const generation = result.generations.get(node.id) ?? 0;
    const y = Math.max(generation * 190 - 45, Math.min(generation * 190 + 45, node.position.y));
    commitProject({
      ...current,
      layout: {
        manualPositions: {
          ...current.layout.manualPositions,
          [node.id]: { x: node.position.x, y },
        },
      },
    });
  }, [commitProject]);



  if (!project) {
    return <main className="loading-screen"><Sprout size={28} /><span>Preparing your family tree</span></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Rooted home"><span className="brand-mark"><Sprout size={19} strokeWidth={1.8} /></span><span>rooted</span></a>
        <div className="toolbar">
          <span className="save-state"><span className={`save-dot save-dot-${saveState}`} />{saveState === 'loading' ? 'Opening' : saveState === 'saving' ? 'Saving' : saveState === 'error' ? 'Save issue' : 'Saved'}</span>
          <button className="icon-button" aria-label="Undo" title="Undo" disabled={!history.past.length} onClick={undo}><Undo2 size={16} /></button>
          <button className="icon-button" aria-label="Redo" title="Redo" disabled={!history.future.length} onClick={redo}><Redo2 size={16} /></button>
          <button className="icon-button" aria-label="Search people" title="Search" onClick={() => setSearchOpen((value) => !value)}><Search size={17} /></button>
          <button className="icon-button desktop-only" aria-label="Export backup" title="Export backup" onClick={exportProject}><Download size={16} /></button>
          <button className="icon-button desktop-only" aria-label="Import backup" title="Import backup" onClick={() => importInput.current?.click()}><Upload size={16} /></button>
          <input ref={importInput} hidden type="file" accept="application/json,.json" onChange={(event) => void importProject(event.target.files?.[0])} />
          <button className="icon-button desktop-only" aria-label="Automatic layout" title="Reset automatic layout" onClick={() => commitProject({ ...project, layout: { manualPositions: {} } })}><LayoutGrid size={16} /></button>
          <button className="primary-button" onClick={() => openPerson()}><Plus size={16} /> Add person</button>
        </div>
      </header>
      {loadFailed && <div className="storage-warning">Rooted could not open your saved tree. Your existing data has not been changed. Reload to try again.</div>}
      {searchOpen && <div className="search-bar"><Search size={16} /><input autoFocus placeholder="Find someone…" value={search} onChange={(event) => setSearch(event.target.value)} /><button className="icon-button" onClick={() => { setSearch(''); setSearchOpen(false); }} aria-label="Close search"><X size={16} /></button></div>}
      {project.people.length === 0 ? (
        <section className="canvas empty-canvas">
          <div className="welcome">
            <div className="welcome-icon"><Sprout size={28} strokeWidth={1.35} /></div>
            <p className="eyebrow">YOUR FAMILY, YOUR STORY</p>
            <h1>A place to put down roots.</h1>
            <p className="welcome-copy">Start with one person. The rest can grow from there.</p>
            <button className="primary-button welcome-button" onClick={() => openPerson()}><Plus size={16} /> Add the first person</button>
            <p className="welcome-note">Your tree is kept privately on this device.</p>
          </div>
        </section>
      ) : (
        <section className="tree-workspace">
          <div className="tree-hint">Select a person to view their details. Drag to arrange within each generation.</div>
          {search && !nodes.some((node) => node.type === 'person') && <div className="search-empty">No matching people.</div>}
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_event, node) => { if (project.people.some((person) => person.id === node.id)) setSelectedId(node.id); }}
            onPaneClick={() => setSelectedId(null)}
            onNodesChange={onNodesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
              window.requestAnimationFrame(() => instance.fitView({ padding: 0.25 }));
            }}
            panOnDrag
            nodesDraggable
            selectionOnDrag={false}
            zoomOnPinch
            minZoom={0.2}
            maxZoom={1.5}
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#d8cfbf" gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
          {selectedPerson && (
            <aside className="person-panel">
              <button className="panel-close" onClick={() => setSelectedId(null)} aria-label="Close details"><X size={17} /></button>
              <span className="panel-eyebrow">PERSON</span>
              <h2>{selectedPerson.name || 'Unnamed person'}</h2>
              <p className="panel-dates">{selectedPerson.birthDate || 'Birth date unknown'}{selectedPerson.deathDate ? ` · ${selectedPerson.deathDate}` : ''}</p>
              <p className="generation-label">{generations?.ok ? `Generation ${(generations.generations.get(selectedPerson.id) ?? 0) + 1}` : 'Generation unavailable'}</p>
              {Object.entries(selectedPerson.attributes).length > 0 && <div className="person-details">{Object.entries(selectedPerson.attributes).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value === null ? 'Not set' : String(value)}</strong></div>)}</div>}
              <div className="relationship-list">
                <span className="relationship-heading">Relationships</span>
                {project.parentage.filter((item) => item.parentId === selectedPerson.id || item.childId === selectedPerson.id).map((item) => {
                  const otherId = item.parentId === selectedPerson.id ? item.childId : item.parentId;
                  const otherName = project.people.find((person) => person.id === otherId)?.name ?? "Unknown person";
                  const label = item.parentId === selectedPerson.id ? item.type.replaceAll("_", " ") + " of " + otherName : item.type.replaceAll("_", " ") + ": " + otherName;
                  return <div className="relationship-row" key={item.id}><span>{label}</span><button onClick={() => editParentage(item)}>Edit</button><button aria-label="Remove relationship" onClick={() => removeParentage(item.id)}><X size={13} /></button></div>;
                })}
                {project.partnerships.filter((item) => item.person1Id === selectedPerson.id || item.person2Id === selectedPerson.id).map((item) => {
                  const otherId = item.person1Id === selectedPerson.id ? item.person2Id : item.person1Id;
                  const otherName = project.people.find((person) => person.id === otherId)?.name ?? "Unknown person";
                  return <div className="relationship-row" key={item.id}><span>{item.type} with {otherName}{item.endDate ? " (ended)" : ""}</span><button onClick={() => editPartnership(item)}>Edit</button><button aria-label="Remove partnership" onClick={() => removePartnership(item.id)}><X size={13} /></button></div>;
                })}
                {project.parentage.every((item) => item.parentId !== selectedPerson.id && item.childId !== selectedPerson.id) && project.partnerships.every((item) => item.person1Id !== selectedPerson.id && item.person2Id !== selectedPerson.id) && <p className="no-relationships">No relationships yet.</p>}
              </div>
              <div className="panel-actions">
                <button className="secondary-button" onClick={() => openPerson(selectedPerson)}>Edit</button>
                <button className="secondary-button" onClick={() => { setEditingRelation(null); setRelationPersonId(''); setNewRelativeName(''); setRelationDirection('child'); setRelationType('biological_parent'); setPartnershipStartDate(''); setPartnershipEndDate(''); setRelationError(''); setDialog('relationship'); }}>Add relationship</button>
                <button className="danger-button" onClick={deletePerson} aria-label="Delete person"><Trash2 size={16} /></button>
              </div>
            </aside>
          )}
        </section>
      )}
      {needRefresh && <div className="update-banner"><span>A new version is ready.</span><button className="primary-button" onClick={() => void updateServiceWorker(true)}>Update</button></div>}
      <footer className="footer"><span>Rooted</span><span>Kept on this device</span><div className="mobile-backup-controls"><button className="icon-button" aria-label="Export backup" onClick={exportProject}><Download size={15} /></button><button className="icon-button" aria-label="Import backup" onClick={() => importInput.current?.click()}><Upload size={15} /></button><button className="icon-button" aria-label="Automatic layout" onClick={() => commitProject({ ...project, layout: { manualPositions: {} } })}><LayoutGrid size={15} /></button></div></footer>

      {dialog && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="modal-close" onClick={() => setDialog(null)} aria-label="Close"><X size={18} /></button>
            {dialog === 'person' ? (
              <form onSubmit={savePerson}>
                <p className="eyebrow">{editingPerson ? 'PERSON DETAILS' : 'A NEW BRANCH'}</p>
                <h2 id="dialog-title">{editingPerson ? 'Edit person' : 'Add a person'}</h2>
                <label>Name<input autoFocus required value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Full name" /></label>
                <div className="date-fields">
                  <label>Born<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
                  <label>Died<input type="date" value={deathDate} onChange={(event) => setDeathDate(event.target.value)} /></label>
                </div>
                <div className="attribute-editor">
                  <span className="attribute-heading">Additional details</span>
                  {attributeRows.map((row, index) => <div className="attribute-row" key={index}>
                    <input aria-label="Detail name" placeholder="Name" value={row.key} onChange={(event) => updateAttributeRow(index, "key", event.target.value)} />
                    <select aria-label="Detail type" value={row.type} onChange={(event) => updateAttributeRow(index, "type", event.target.value as AttributeRow["type"])}>
                      <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="boolean">Yes or no</option>
                    </select>
                    {row.type === "boolean" ? <select aria-label="Detail value" value={row.value} onChange={(event) => updateAttributeRow(index, "value", event.target.value)}><option value="true">Yes</option><option value="false">No</option></select>
                      : <input aria-label="Detail value" type={row.type === "text" ? "text" : row.type} placeholder="Value" value={row.value} onChange={(event) => updateAttributeRow(index, "value", event.target.value)} /> }
                    <button className="attribute-remove" type="button" aria-label="Remove detail" onClick={() => setAttributeRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><X size={14} /></button>
                  </div>)}
                  <button className="text-button" type="button" onClick={() => setAttributeRows((rows) => [...rows, { key: "", value: "", type: "text" }])}><Plus size={14} /> Add detail</button>
                  <label>Show on person card
                    <select value={displayAttribute} onChange={(event) => setDisplayAttribute(event.target.value)}>
                      <option value="">Nothing</option>
                      {attributeRows.filter((row) => row.key.trim()).map((row, index) => <option key={index} value={row.key}>{row.key}</option>)}
                    </select>
                  </label>
                  {attributeError && <p className="form-error">{attributeError}</p>}
                </div>
                <button className="primary-button modal-submit" type="submit"><Check size={16} /> Save person</button>
              </form>
            ) : (
              <form onSubmit={saveRelationship}>
                <p className="eyebrow">CONNECT YOUR TREE</p>
                <h2 id="dialog-title">{editingRelation ? 'Edit relationship' : 'Add a relationship'}</h2>
                <label>Relationship type
                  <select value={relationType} onChange={(event) => setRelationType(event.target.value as ParentageType | 'marriage' | 'partnership')}>
                    {(!editingRelation || editingRelation.kind === 'parentage') && parentageTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    {(!editingRelation || editingRelation.kind === 'partnership') && <><option value="marriage">Marriage</option><option value="partnership">Non marital partnership</option></>}
                  </select>
                </label>
                {relationType === 'marriage' || relationType === 'partnership' ? (
                  <div className="date-fields">
                    <label>Started<input type="date" value={partnershipStartDate} onChange={(event) => setPartnershipStartDate(event.target.value)} /></label>
                    <label>Ended<input type="date" value={partnershipEndDate} onChange={(event) => setPartnershipEndDate(event.target.value)} /></label>
                  </div>
                ) : (
                  <label>Direction
                    <select value={relationDirection} onChange={(event) => setRelationDirection(event.target.value as 'parent' | 'child')}>
                      <option value="child">This person is the parent</option>
                      <option value="parent">This person is the child</option>
                    </select>
                  </label>
                )}
                <label>Connect to
                  <select required value={relationPersonId} onChange={(event) => setRelationPersonId(event.target.value)}>
                    <option value="">Choose a person</option>
                    {project.people.filter((person) => person.id !== selectedPerson?.id).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                    <option value="__new__" disabled={!!editingRelation}>Create a new person…</option>
                  </select>
                </label>
                {relationPersonId === '__new__' && <label>New person’s name<input autoFocus required value={newRelativeName} onChange={(event) => setNewRelativeName(event.target.value)} placeholder="Full name" /></label>}
                {relationError && <p className="form-error">{relationError}</p>}
                <button className="primary-button modal-submit" type="submit"><Check size={16} /> Save relationship</button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
