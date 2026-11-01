import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import {
  Background, Controls, ReactFlow, type Edge, type Node, type NodeProps,
  Handle, Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Check, Heart, Plus, Search, Sprout, Trash2, X } from 'lucide-react';
import { createEmptyProject, type ParentageType, type Person, type Project } from './domain/schema';
import { calculateGenerations, validateParentage } from './domain/relationships';
import { loadProject, saveProject } from './data/database';

type PersonNodeData = { person: Person; selected: boolean };
type PersonFlowNode = Node<PersonNodeData, 'person'>;

function PersonCard({ data }: NodeProps<PersonFlowNode>) {
  const date = data.person.birthDate ? new Date(data.person.birthDate).getFullYear() : null;
  const death = data.person.deathDate ? new Date(data.person.deathDate).getFullYear() : null;
  return (
    <div className={`person-card ${data.selected ? 'person-card-selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="person-card-name">{data.person.name || 'Unnamed person'}</div>
      {(date || death) && <div className="person-card-dates">{date ?? '?'}{death ? ` · ${death}` : ''}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { person: PersonCard };
const parentageTypes: { value: ParentageType; label: string }[] = [
  { value: 'biological_parent', label: 'Biological parent' },
  { value: 'adoptive_parent', label: 'Adoptive parent' },
  { value: 'step_parent', label: 'Step parent' },
  { value: 'guardian', label: 'Guardian' },
];

function arrange(project: Project): Record<string, { x: number; y: number }> {
  const result = calculateGenerations(project);
  if (!result.ok) return project.layout.manualPositions;
  const bands = new Map<number, string[]>();
  for (const person of project.people) {
    const generation = result.generations.get(person.id) ?? 0;
    bands.set(generation, [...(bands.get(generation) ?? []), person.id]);
  }
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [generation, ids] of bands) {
    ids.forEach((id, index) => {
      positions[id] = { x: index * 240, y: generation * 190 };
    });
  }
  return positions;
}

function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [saveState, setSaveState] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'person' | 'relationship' | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personName, setPersonName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [relationType, setRelationType] = useState<ParentageType>('biological_parent');
  const [relationPersonId, setRelationPersonId] = useState('');
  const [relationDirection, setRelationDirection] = useState<'parent' | 'child'>('child');
  const [relationError, setRelationError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    loadProject().then((saved) => {
      if (!active) return;
      setProject(saved ?? createEmptyProject());
      setStorageReady(true);
      setSaveState('saved');
    }).catch(() => {
      if (!active) return;
      setProject(createEmptyProject());
      setStorageReady(true);
      setSaveState('error');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!project || !storageReady || saveState === 'error') return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      saveProject(project).then(() => setSaveState('saved')).catch(() => setSaveState('error'));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [project, storageReady]);

  const selectedPerson = project?.people.find((person) => person.id === selectedId) ?? null;
  const generations = useMemo(() => project ? calculateGenerations(project) : null, [project]);
  const nodes = useMemo<PersonFlowNode[]>(() => {
    if (!project) return [];
    const automatic = arrange(project);
    return project.people
      .filter((person) => !search || person.name.toLowerCase().includes(search.toLowerCase()))
      .map((person) => ({
        id: person.id, type: 'person', position: project.layout.manualPositions[person.id] ?? automatic[person.id] ?? { x: 0, y: 0 },
        data: { person, selected: person.id === selectedId },
      }));
  }, [project, selectedId, search]);
  const edges = useMemo<Edge[]>(() => {
    if (!project) return [];
    return [
      ...project.parentage.map((relation) => ({
        id: relation.id, source: relation.parentId, target: relation.childId,
        type: 'smoothstep', animated: false,
        style: { stroke: relation.type === 'biological_parent' ? '#8b765e' : '#a99a83', strokeWidth: 1.5, strokeDasharray: relation.type === 'guardian' || relation.type === 'step_parent' ? '5 4' : undefined },
      })),
      ...project.partnerships.map((relation) => ({
        id: relation.id, source: relation.person1Id, target: relation.person2Id,
        type: 'straight', label: relation.type === 'marriage' ? '♥' : '♡', labelStyle: { fill: '#78805a', fontSize: 13 },
        style: { stroke: '#78805a', strokeWidth: 1.5 },
      })),
    ];
  }, [project]);

  const openPerson = (person?: Person) => {
    setEditingPerson(person ?? null);
    setPersonName(person?.name ?? '');
    setBirthDate(person?.birthDate ?? '');
    setDeathDate(person?.deathDate ?? '');
    setDialog('person');
  };

  const savePerson = (event: FormEvent) => {
    event.preventDefault();
    if (!project || !personName.trim()) return;
    if (editingPerson) {
      setProject({ ...project, people: project.people.map((person) => person.id === editingPerson.id
        ? { ...person, name: personName.trim(), birthDate: birthDate || null, deathDate: deathDate || null }
        : person) });
      setSelectedId(editingPerson.id);
    } else {
      const person: Person = { id: crypto.randomUUID(), name: personName.trim(), birthDate: birthDate || null, deathDate: deathDate || null, attributes: {}, displayAttribute: null };
      setProject({ ...project, people: [...project.people, person] });
      setSelectedId(person.id);
    }
    setDialog(null);
  };

  const saveRelationship = (event: FormEvent) => {
    event.preventDefault();
    if (!project || !selectedPerson || !relationPersonId) return;
    const relation = {
      id: crypto.randomUUID(), type: relationType,
      parentId: relationDirection === 'child' ? selectedPerson.id : relationPersonId,
      childId: relationDirection === 'child' ? relationPersonId : selectedPerson.id,
    };
    const error = validateParentage(project, relation);
    if (error) { setRelationError(error); return; }
    setProject({ ...project, parentage: [...project.parentage, relation] });
    setDialog(null);
    setRelationError('');
  };

  const deletePerson = () => {
    if (!project || !selectedPerson) return;
    const id = selectedPerson.id;
    setProject({
      ...project,
      people: project.people.filter((person) => person.id !== id),
      parentage: project.parentage.filter((item) => item.parentId !== id && item.childId !== id),
      partnerships: project.partnerships.filter((item) => item.person1Id !== id && item.person2Id !== id),
      layout: { manualPositions: Object.fromEntries(Object.entries(project.layout.manualPositions).filter(([key]) => key !== id)) },
    });
    setSelectedId(null);
  };

  const onNodeDragStop = useCallback((_event: MouseEvent, node: Node) => {
    setProject((current) => {
      if (!current) return current;
      const result = calculateGenerations(current);
      const generation = result.ok ? result.generations.get(node.id) ?? 0 : 0;
      return {
        ...current,
        layout: { manualPositions: { ...current.layout.manualPositions, [node.id]: { x: node.position.x, y: generation * 190 } } },
      };
    });
  }, []);

  const addPartnership = () => {
    if (!project || !selectedPerson || !relationPersonId || relationPersonId === selectedPerson.id) return;
    if (project.partnerships.some((item) => [item.person1Id, item.person2Id].includes(selectedPerson.id) && [item.person1Id, item.person2Id].includes(relationPersonId))) {
      setRelationError('These people already have a partnership record.');
      return;
    }
    setProject({ ...project, partnerships: [...project.partnerships, {
      id: crypto.randomUUID(), type: 'marriage', person1Id: selectedPerson.id, person2Id: relationPersonId, startDate: null, endDate: null,
    }] });
    setDialog(null);
    setRelationError('');
  };

  if (!project) {
    return <main className="loading-screen"><Sprout size={28} /><span>Preparing your family tree</span></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Rooted home"><span className="brand-mark"><Sprout size={19} strokeWidth={1.8} /></span><span>rooted</span></a>
        <div className="toolbar">
          <span className="save-state"><span className={`save-dot save-dot-${saveState}`} />{saveState === 'loading' ? 'Opening' : saveState === 'saving' ? 'Saving' : saveState === 'error' ? 'Save issue' : 'Saved'}</span>
          <button className="icon-button" aria-label="Search people" onClick={() => setSearchOpen((value) => !value)}><Search size={17} /></button>
          <button className="primary-button" onClick={() => openPerson()}><Plus size={16} /> Add person</button>
        </div>
      </header>
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
          <div className="tree-hint">Select a person to view their details. Drag to arrange within a generation.</div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_event, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            onNodeDragStop={onNodeDragStop}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={1.5}
            nodesDraggable
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
              <div className="panel-actions">
                <button className="secondary-button" onClick={() => openPerson(selectedPerson)}>Edit</button>
                <button className="secondary-button" onClick={() => { setRelationPersonId(''); setRelationError(''); setDialog('relationship'); }}>Add relationship</button>
                <button className="danger-button" onClick={deletePerson} aria-label="Delete person"><Trash2 size={16} /></button>
              </div>
            </aside>
          )}
        </section>
      )}
      <footer className="footer"><span>Rooted</span><span>Kept on this device</span></footer>

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
                <button className="primary-button modal-submit" type="submit"><Check size={16} /> Save person</button>
              </form>
            ) : (
              <form onSubmit={saveRelationship}>
                <p className="eyebrow">CONNECT YOUR TREE</p>
                <h2 id="dialog-title">Add a relationship</h2>
                <label>Relationship type
                  <select value={relationType} onChange={(event) => setRelationType(event.target.value as ParentageType)}>
                    {parentageTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>Direction
                  <select value={relationDirection} onChange={(event) => setRelationDirection(event.target.value as 'parent' | 'child')}>
                    <option value="child">This person is the parent</option>
                    <option value="parent">This person is the child</option>
                  </select>
                </label>
                <label>Connect to
                  <select required value={relationPersonId} onChange={(event) => setRelationPersonId(event.target.value)}>
                    <option value="">Choose a person</option>
                    {project.people.filter((person) => person.id !== selectedPerson?.id).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                </label>
                {relationError && <p className="form-error">{relationError}</p>}
                <button className="primary-button modal-submit" type="submit"><Check size={16} /> Save relationship</button>
                <button className="text-button" type="button" onClick={addPartnership}><Heart size={15} /> Add as marriage instead</button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
