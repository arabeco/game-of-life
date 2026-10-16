from pathlib import Path
p=Path('components/ActionModal.tsx')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("import './core-ui.css';", "import './core-ui.css';\nimport './action-layout.css';")
s=s.replace("return `${hours}h ${minutes}m`;", "return `${hours}h ${minutes}min`;")
s=s.replace('<span className="text-sm font-semibold text-white">{formatValue ? formatValue(value) : `${value} ${unit}`}</span>', '''<label className="action-number"><input aria-label={`${label} em ${unit}`} type="number" inputMode="numeric" min={min} max={max} step={step} value={value}
                    onChange={e => { if (e.target.value !== '') onChange(Math.max(min, Math.min(max, Math.round(Number(e.target.value))))); }} /><span>{unit}</span></label>''')
s=s.replace('className="w-full h-2 bg-gray-700', 'aria-valuetext={formatValue ? formatValue(value) : `${value} ${unit}`}\n                className="w-full h-2 bg-gray-700',1)
needle='''            />
        </div>
    );

const DayToggle'''
s=s.replace(needle,'''            />
            {formatValue && <output className="action-duration-equivalent">{formatValue(value)}</output>}
        </div>
    );

const DayToggle''',1)
s=s.replace("('schedule');", "('context');",1)
s=s.replace("const [isBriefingReaderOpen", "const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);\n    const [isBriefingReaderOpen",1)
# Keep existing protected edit and task-occurrence flows, replace only navigation/content layout.
a=s.index('                    {/* Tabs Fixed */}')
b=s.index('                    {/* Content Scrollable */}',a)
s=s[:a]+'''                    <nav className="action-main-tabs" aria-label="Abas da ação">
                        {([
                            ['basic', 'Geral', true],
                            ['context', 'Contexto', mode === 'edit' || !!displayAction?.description || !!displayAction?.context || displayAction?.scheduledStartTime != null],
                            ['note', 'Checklist', mode === 'edit' || !!displayAction?.briefing || !!displayAction?.preFlight?.length],
                            ['media', 'Mídia', mode === 'edit' || !!displayAction?.assets?.length],
                        ] as const).filter(([key, , visible]) => visible && (!isEditingTaskInstance || key === 'basic')).map(([key, title]) => (
                            <button key={key} aria-pressed={key === 'basic' ? activeTab === 'basic' : activeTab === 'advanced' && advancedSubTab === key}
                                onClick={() => { setActiveTab(key === 'basic' ? 'basic' : 'advanced'); if (key !== 'basic') setAdvancedSubTab(key); setSchedulePanelOpen(false); }}>
                                {title}
                            </button>
                        ))}
                    </nav>

'''+s[b:]
s=s.replace('className="flex-1 overflow-y-auto custom-scrollbar relative bg-gradient-to-b from-black/40 to-transparent"', 'className="action-tab-body"')
s=s.replace('className="p-4 space-y-3 flex flex-col items-center animate-fade-in pb-16"', 'className="action-general p-4 space-y-3 flex flex-col items-center animate-fade-in"')
s=s.replace("<div className={`action-measures grid gap-2 ${editableAction.actionType === 'Ação Recorrente' ? 'grid-cols-2' : 'grid-cols-1'}`}>", '<div className="action-measures grid grid-cols-1 gap-2">')
s=s.replace('min={15} max={480}', 'min={5} max={480}')
s=s.replace('className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo da ação"','className="action-type-options" role="group" aria-label="Tipo da ação"')
s=s.replace('ACTION_TYPE_CHOICES.map(choice', "[...ACTION_TYPE_CHOICES].sort((a, b) => ['Ação Recorrente', 'Livre', 'Marco', 'Compromisso'].indexOf(a.value) - ['Ação Recorrente', 'Livre', 'Marco', 'Compromisso'].indexOf(b.value)).map(choice")
s=s.replace('aria-label="Nome da ação"', 'aria-label="Nome da ação"\n                                                    maxLength={80}')
s=s.replace('ui-modal-title mt-1 break-words', 'ui-modal-title mt-1 line-clamp-2 break-words')
# Remove old duplicate scheduling from General.
a=s.index('                                                {/* QUANDO VEM DEPOIS DE O QUE.')
b=s.index('                                                {/* O "Excluir Ação"',a)
s=s[:a]+s[b:]
# Reuse media editor unchanged, retaining upload and content protections.
a=s.index("                                    {advancedSubTab === 'media' && (")
b=s.index("                                    {advancedSubTab === 'note' && (",a)
media=s[a:b]
# Preserve optional energy/matrix controls in a separate compact internal section.
a=s.index("                                    {advancedSubTab === 'context' && (")
b=s.index('                                </div>\n                            </div>\n                        )}',a)
context=s[a:b].replace("{advancedSubTab === 'context' && (", "{(mode === 'edit' || displayAction?.context?.energyLevel || displayAction?.context?.plannerQuadrant) && (")
a=s.index('                        {/* ADVANCED TAB */}')
b=s.index('                    {/* 3. FOOTER (Fixed) */}',a)
advanced='''                        {activeTab === 'advanced' && <div className={`action-section action-section-${advancedSubTab}`}>
                            {advancedSubTab === 'context' && <>
                                {!schedulePanelOpen ? <>
                                    {mode === 'edit' && canEditExecutionSettings && <StyledRangeInput label="Dificuldade" value={normalizeActionDifficulty(editableAction.difficulty)} min={0} max={3} step={1} unit={difficultyLabels[normalizeActionDifficulty(editableAction.difficulty)]} onChange={value => setEditableAction(p => ({...p, difficulty: value}))} />}
                                    {(mode === 'edit' || displayAction?.description) && <label className="action-context-note"><span>Contexto</span>
                                        {mode === 'edit' ? <textarea aria-label="Contexto da ação" maxLength={1000} value={editableAction.description || ''} disabled={!canEditAuthorialContent} onChange={e => setEditableAction(p => ({...p, description:e.target.value}))} placeholder="Onde ou em que situação?" /> : <p>{displayAction?.description}</p>}
                                    </label>}
                                    {(displayAction?.actionType === 'Ação Recorrente' || displayAction?.actionType === 'Compromisso') && <button className="action-schedule-entry" onClick={() => setSchedulePanelOpen(true)}><span>Agendamento<small>{temHorario ? `${startTime}${selectedDays.length ? ' · '+selectedDays.map(d=>d.slice(0,3)).join(', ') : ''}` : 'Não definido'}</small></span><ChevronRightIcon className="w-4 h-4" /></button>}
                                    <details className="action-extra-context"><summary>Energia e prioridade</summary><div className="action-inner-scroll">CONTEXT_EXISTING</div></details>
                                </> : <div className="action-schedule-panel">
                                    <button className="action-back" onClick={() => setSchedulePanelOpen(false)}>← Contexto</button>
                                    <div className="action-schedule-fields">
                                        <label>{editableAction.actionType === 'Compromisso' ? 'Data' : 'A partir de'}<input aria-label="Data de início" type="date" disabled={mode !== 'edit' || !canEditExecutionSettings} value={editableAction.actionType === 'Compromisso' ? (selectedDate ? getLocalDateString(selectedDate) : '') : (editableAction.context?.schedule?.startsOn || getLocalDateString())} onChange={e => { if (editableAction.actionType === 'Compromisso') setSelectedDate(e.target.value ? getTaskDateValue(e.target.value) : null); else updateScheduleContext(schedule=>({...schedule, startsOn:e.target.value, limitToRepetitions:true})); }} /></label>
                                        <label>Horário<input aria-label="Horário obrigatório" type="time" required disabled={mode !== 'edit' || !canEditExecutionSettings} value={temHorario ? startTime! : ''} onChange={e => { setStartTime(e.target.value || null); if (editableAction.actionType === 'Ação Recorrente') updateScheduleContext(schedule=>({...schedule, startsOn:schedule.startsOn || getLocalDateString(), limitToRepetitions:true})); }} /></label>
                                    </div>
                                    {editableAction.actionType === 'Ação Recorrente' && <div className="action-weekdays">{week.map(day => <button key={day} aria-pressed={selectedDays.includes(day)} disabled={mode !== 'edit' || !canEditExecutionSettings} onClick={()=>{handleDayToggle(day);updateScheduleContext(schedule=>({...schedule, startsOn:schedule.startsOn || getLocalDateString(),limitToRepetitions:true}));}}>{day.slice(0,3)}</button>)}</div>}
                                    {agendaPrevista && <p className="action-schedule-summary">{agendaPrevista.vezes} de {editableAction.repetitions || 1} repetições neste ciclo · até {agendaPrevista.ateLabel}</p>}
                                    {canUseReminderToggle && <button className="action-schedule-entry" disabled={mode !== 'edit'} aria-pressed={editableAction.context?.schedule?.notifyBeforeMinutes === 15} onClick={()=>{void handleReminderToggle();}}><span>Lembrar 15 min antes</span><span>{editableAction.context?.schedule?.notifyBeforeMinutes === 15 ? 'Ligado' : 'Desligado'}</span></button>}
                                    {mode === 'edit' && canEditExecutionSettings && <button className="action-back" onClick={()=>{setStartTime(null);setSelectedDays([]);updateScheduleContext(()=>({}));setSchedulePanelOpen(false);}}>Remover agendamento</button>}
                                </div>}
                            </>}
                            {advancedSubTab === 'note' && <>
                                {(mode === 'edit' || displayAction?.briefing) && <label className="action-briefing"><span>Anotação</span>{mode === 'edit' && canEditAuthorialContent ? <textarea aria-label="Anotação" value={editableAction.briefing || ''} onChange={e=>setEditableAction(p=>({...p,briefing:e.target.value}))} placeholder="Escreva aqui…" /> : <p>{displayAction?.briefing || 'Sem anotação.'}</p>}</label>}
                                {briefingPages.length > 0 && <button className="action-read-link" onClick={openBriefingReader}>Abrir leitura</button>}
                                <div className="action-checklist-label">Checklist</div>
                                <div className="action-checklist-scroll" aria-label="Itens do checklist">{(displayAction?.preFlight || []).map((item,i)=><div className="action-checklist-row" key={i}><span title={item}>{item}</span>{mode === 'edit' && canEditAuthorialContent && <button aria-label="Remover item do checklist" onClick={()=>setEditableAction(p=>({...p,preFlight:p.preFlight?.filter((_,idx)=>idx!==i)}))}><XIcon className="w-4 h-4" /></button>}</div>)}</div>
                                {mode === 'edit' && canEditAuthorialContent && <form className="action-checklist-add" onSubmit={e=>{e.preventDefault();if(newChecklistItem.trim()){setEditableAction(p=>({...p,preFlight:[...(p.preFlight || []),newChecklistItem.trim()]}));setNewChecklistItem('');}}}><input aria-label="Novo item do checklist" maxLength={200} value={newChecklistItem} onChange={e=>setNewChecklistItem(e.target.value)} placeholder="Adicionar item…" /><button type="submit" aria-label="Adicionar item ao checklist">+</button></form>}
                            </>}
MEDIA_EXISTING
                        </div>}
                    </div>

'''.replace('CONTEXT_EXISTING',context).replace('MEDIA_EXISTING',media)
s=s[:a]+advanced+s[b:]
s=s.replace("'--accent-bronze': accentColor", "'--action-accent': accentColor, '--accent-bronze': accentColor")
s=s.replace('action-dialog w-full', 'action-dialog action-dialog-v2 w-full')
s=s.replace("        setSelectedDays(nextAction?.scheduledDays || []);", "        setSchedulePanelOpen(false);\n        setSelectedDays(nextAction?.scheduledDays || []);")
# Validation remains on save, independent of whether the schedule panel is visible.
pos=s.index('        const nextRepetitions =')
s=s[:pos]+'''        if (!isEditingTaskInstance && (selectedDays.length > 0 || editableAction.actionType === 'Compromisso') && scheduledStartTime === undefined) {
            refuseSave('Escolha o horário do agendamento.'); setActiveTab('advanced'); setAdvancedSubTab('context'); setSchedulePanelOpen(true); return;
        }
        if (!isEditingTaskInstance && editableAction.actionType === 'Compromisso' && !selectedDate) {
            refuseSave('Escolha a data do compromisso.'); setActiveTab('advanced'); setAdvancedSubTab('context'); setSchedulePanelOpen(true); return;
        }
'''+s[pos:]
s=s.replace("const hoje = getLocalDateString();\n        const ate", "const hoje = editableAction.context?.schedule?.startsOn && editableAction.context.schedule.startsOn > getLocalDateString() ? editableAction.context.schedule.startsOn : getLocalDateString();\n        const ate")
s=s.replace('const vezes = countRecurringOccurrences({ from: hoje, through: ate, daysOfWeek: selectedDays });','const available = countRecurringOccurrences({ from: hoje, through: ate, daysOfWeek: selectedDays });\n        const vezes = editableAction.context?.schedule?.limitToRepetitions ? Math.min(available, editableAction.repetitions || 1) : available;')
s=s.replace('[activeCycle, editableAction.actionType, selectedDays, temHorario]', '[activeCycle, editableAction.actionType, editableAction.context?.schedule?.startsOn, editableAction.context?.schedule?.limitToRepetitions, editableAction.repetitions, selectedDays, temHorario]')
p.write_text(s,encoding='utf-8')
