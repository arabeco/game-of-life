from pathlib import Path
p=Path('components/ArenaDetailModal.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace("import './arena-ui.css';", "import './arena-ui.css';\nimport './arena-layout.css';")
s=s.replace('    const [showDeleteConfirmation', "    const [arenaTab, setArenaTab] = useState<'actions' | 'about'>('actions');\n    const [showDeleteConfirmation",1)
s=s.replace('max-w-[21rem]', 'max-w-[27rem]',1)
s=s.replace("borderColor: 'var(--skin-accent-color)',", "borderColor: accentColor,\n                        '--arena-accent': accentColor,",1).replace("].join(', '),\n                    }}", "].join(', '),\n                    } as React.CSSProperties}",1)
s=s.replace('className="relative z-10 flex flex-col space-y-3"','className="arena-detail-content relative z-10 flex flex-col space-y-3"',1)
s=s.replace('onClick={handleEditToggle}', "aria-label={isEditing ? 'Salvar arena' : 'Editar arena'} onClick={() => { handleEditToggle(); setArenaTab('about'); }}",1)
# Deletion stays inside editing only, keep archived/linked deletion semantics.
a=s.index('                                {canDeleteArenaFromModal && (isSpecialArena')
b=s.index('                                {!isReadOnlyArena && isEditing',a)
s=s[:a]+s[b:]
a=s.index('                        <div className="flex-shrink-0 flex flex-col items-center text-center space-y-1">')
b=s.index('                        <div className="flex-grow space-y-2 flex flex-col overflow-y-auto">',a)
about=s[a:b]
about=about.replace('className="w-20 h-20', 'className="w-12 h-12').replace('scale-[2.55]', 'scale-[1.5]')
about=about.replace('type="text"\n                                        value={editableArena.name}', 'type="text"\n                                        maxLength={80}\n                                        aria-label="Nome da arena"\n                                        value={editableArena.name}')
about=about.replace('rows={2}', 'rows={2}\n                                        maxLength={1000}\n                                        aria-label="Descrição da arena"')
c=s.index('                        <div className="flex-shrink-0 space-y-2 pt-2">',b)
listing='''                        <nav className="arena-detail-tabs" aria-label="Abas da arena">
                            <button aria-pressed={arenaTab === 'actions' && !isEditing} onClick={()=>setArenaTab('actions')} disabled={isEditing}>Ações</button>
                            <button aria-pressed={arenaTab === 'about' || isEditing} onClick={()=>setArenaTab('about')}>Sobre</button>
                        </nav>
                        {(arenaTab === 'about' || isEditing) ? <div className="arena-about">ABOUT</div> : <>
                            <div className="arena-actions-list" aria-label="Ações da arena">
                                {allActions.map(action => {
                                    const completed = tasksForCounts.filter(task=>task.actionId === action.id && task.completed).length;
                                    return <button key={action.id} className="arena-action-row" onClick={()=>openActionDetails(action)}>
                                        <span className="arena-action-tile" style={getActionBackgroundStyle(action.id)}><EmojiGlyph symbol={action.icon || '📝'} size="picker" /></span>
                                        <span className="arena-action-copy"><strong>{action.name}</strong><small>{action.duration} min · {action.actionType === 'Ação Recorrente' ? `${completed}/${action.repetitions || 1} repetições` : action.actionType === 'Marco' ? (completed ? 'Marco alcançado' : 'Marco') : action.actionType}</small></span>
                                    </button>;
                                })}
                                {!allActions.length && <p className="arena-actions-empty">Nenhuma ação ainda.</p>}
                            </div>
                            {!previewMode && !isReadOnlyArena && !isArenaDeJornada && <button aria-label="Nova ação" id="add-action-button" ref={newActionRef} onClick={openNewAction} className="arena-action-add"><PlusIcon className="w-5 h-5" /></button>}
                        </>}
'''.replace('ABOUT',about)
s=s[:a]+listing+s[c:]
p.write_text(s,encoding='utf-8')
p=Path('components/ArenaCard.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('arena-plate rounded-lg', 'arena-plate rounded-[4px]')
s=s.replace('rounded-[0.58rem]', 'rounded-[4px]').replace('rounded-[0.48rem]', 'rounded-[4px]')
s=s.replace('w-full overflow-x-auto hide-scrollbar rounded-[4px]', 'arena-thumbnail-actions w-full overflow-x-auto overscroll-x-contain hide-scrollbar rounded-[4px]')
p.write_text(s,encoding='utf-8')
p=Path('components/NewArenaModal.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('max-w-sm m-4 space-y-4 rounded-3xl', 'max-w-md m-4 space-y-3 rounded-xl')
s=s.replace('placeholder="Nome da Arena"','placeholder="Nome da Arena"\n                                aria-label="Nome da arena"\n                                maxLength={80}')
s=s.replace('<textarea id="new-arena-description-input"', '<textarea maxLength={1000} style={{height:72,resize:"none",overflowY:"auto",scrollbarWidth:"none"}} id="new-arena-description-input"')
s=s.replace('luxe-bico luxe-skin-button disabled:', 'luxe-bico luxe-skin-button luxe-reward-gold luxe-brilho disabled:')
p.write_text(s,encoding='utf-8')
