import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GardenExperimentModal } from '../components/GardenExperimentModal';

function Check() {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(0);
  return <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
    <h1>Verificação do jardim experimental</h1>
    <button onClick={() => setOpen(true)}>Abrir Jardim experimental</button>
    <p role="status">Fechamentos concluídos: {closed}</p>
    {open && <GardenExperimentModal onClose={() => { setOpen(false); setClosed(value => value + 1); }} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Check />);
