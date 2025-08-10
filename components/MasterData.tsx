import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
    BusinessVertical, LeadSourceMaster, SchemeMaster, Company, FinRootsBranch, Geography, RelationshipType, 
    DocumentMaster, SchemeDocumentMapping, GiftMaster, TaskStatusMaster, CustomerCategory, PolicyType, GeneralInsuranceType,
    BankMaster, Member, FinRootsCompanyInfo, CustomerSubCategory, CustomerGroup, TaskMaster, SubTaskMaster, AdvisorAddress, BranchCompanyMapping, PolicyChecklistMaster,
    InsuranceTypeMaster,
    InsuranceFieldMaster,
    User,
    ConcretePolicyType,
    GiftMapping,
    ReferralType,
    Route,
    RolePermissions,
    AppModule
} from '../types.ts';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import Modal from './ui/Modal.tsx';
import { Database, Briefcase, Users, GitBranch, MapPin, Link as LinkIcon, FileText as FileTextIcon, Gift, CheckSquare, Settings, Plus, Save, Edit2, Trash2, X, Building, Search, AlertTriangle, ChevronRight, ListTodo, SlidersHorizontal, ArrowUp, ArrowDown, CornerDownRight, GripVertical, ChevronDown, Lock } from 'lucide-react';
import ToggleSwitch from './ui/ToggleSwitch.tsx';

interface MasterDataProps {
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    businessVerticals: BusinessVertical[];
    onUpdateBusinessVerticals: (data: BusinessVertical[]) => void;
    leadSources: LeadSourceMaster[];
    onUpdateLeadSources: (data: LeadSourceMaster[]) => void;
    schemes: SchemeMaster[];
    onUpdateSchemes: (data: SchemeMaster[]) => void;
    companies: Company[];
    onUpdateCompanies: (data: Company[]) => void;
    finrootsBranches: FinRootsBranch[];
    onUpdateFinrootsBranches: (data: FinRootsBranch[]) => void;
    finrootsCompanyInfo: FinRootsCompanyInfo;
    onUpdateFinRootsCompanyInfo: (data: FinRootsCompanyInfo) => void;
    geographies: Geography[];
    onUpdateGeographies: (data: Geography[]) => void;
    relationshipTypes: RelationshipType[];
    onUpdateRelationshipTypes: (data: RelationshipType[]) => void;
    documentMasters: DocumentMaster[];
    onUpdateDocumentMasters: (data: DocumentMaster[]) => void;
    schemeDocumentMappings: SchemeDocumentMapping[];
    onUpdateSchemeDocumentMappings: (data: SchemeDocumentMapping[]) => void;
    giftMasters: GiftMaster[];
    onUpdateGiftMasters: (data: GiftMaster[]) => void;
    giftMappings: GiftMapping[];
    onUpdateGiftMappings: (data: GiftMapping[]) => void;
    taskStatuses: TaskStatusMaster[];
    onUpdateTaskStatuses: (data: TaskStatusMaster[]) => void;
    customerCategories: CustomerCategory[];
    onUpdateCustomerCategories: (data: CustomerCategory[]) => void;
    bankMasters: BankMaster[];
    onUpdateBankMasters: (data: BankMaster[]) => void;
    customerSubCategories: CustomerSubCategory[];
    onUpdateCustomerSubCategories: (data: CustomerSubCategory[]) => void;
    customerGroups: CustomerGroup[];
    onUpdateCustomerGroups: (data: CustomerGroup[]) => void;
    taskMasters: TaskMaster[];
    onUpdateTaskMasters: (data: TaskMaster[]) => void;
    subTaskMasters: SubTaskMaster[];
    onUpdateSubTaskMasters: (data: SubTaskMaster[]) => void;
    policyChecklistMasters: PolicyChecklistMaster[];
    onUpdatePolicyChecklistMasters: (data: PolicyChecklistMaster[]) => void;
    insuranceTypes: InsuranceTypeMaster[];
    onUpdateInsuranceTypes: (data: InsuranceTypeMaster[]) => void;
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    currentUser: User | null;
    operatingCompanies: Company[];
    onUpdateOperatingCompanies: (data: Company) => void;
    routes: Route[];
    onUpdateRoutes: (data: Route[]) => void;
    rolePermissions: RolePermissions[];
    onUpdateRolePermissions: (permissions: RolePermissions) => void;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
const themeAwareInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
const modalInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const SortableHeader: React.FC<{
    sortKey: string;
    label: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: string) => void;
    className?: string;
    reorderable?: boolean;
}> = ({ sortKey, label, sortConfig, onSort, className = '', reorderable }) => (
    <th className={`px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase ${className}`}>
        <button onClick={() => !reorderable && onSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100" disabled={reorderable}>
            {label}
            {!reorderable && (
                <div className="w-4">
                    {sortConfig.key === sortKey ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                        <ArrowUp size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            )}
        </button>
    </th>
);

// --- NEW: Role Permissions Manager Component ---
const RolePermissionsManager: React.FC<{
    permissions: RolePermissions[];
    onSave: (permissions: RolePermissions) => void;
    addToast: MasterDataProps['addToast'];
}> = ({ permissions, onSave, addToast }) => {
    const advisorPermissions = useMemo(() => permissions.find(p => p.role === 'Advisor'), [permissions]);
    const [localPermissions, setLocalPermissions] = useState<RolePermissions | null>(null);

    useEffect(() => {
        // Deep copy to avoid direct state mutation
        if (advisorPermissions) {
            setLocalPermissions(JSON.parse(JSON.stringify(advisorPermissions)));
        }
    }, [advisorPermissions]);

    const handleToggle = (module: AppModule, value: boolean) => {
        setLocalPermissions(prev => {
            if (!prev) return null;
            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [module]: value,
                },
            };
        });
    };

    const handleSave = () => {
        if (localPermissions) {
            onSave(localPermissions);
        }
    };

    if (!localPermissions) {
        return <div>Loading permissions...</div>;
    }
    
    // Define the display order and friendly names for modules
    const moduleDisplayOrder: { key: AppModule; name: string }[] = [
        { key: 'dashboard', name: 'Dashboard' },
        { key: 'reports & insights', name: 'Reports & Insights' },
        { key: 'pipeline', name: 'Lead Management' },
        { key: 'customers', name: 'Customers' },
        { key: 'taskManagement', name: 'Task Management' },
        { key: 'policies', name: 'Policies' },
        { key: 'notes', name: 'Notes' },
        { key: 'actionHub', name: 'Action Hub' },
        { key: 'servicesHub', name: 'Services Hub' },
        { key: 'location', name: 'Location Services' },
        { key: 'chatbot', name: 'WhatsApp Bot' },
        // Admin-only modules are excluded from this user-facing list
    ];


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Role Permissions: Advisor</h3>
                <Button onClick={handleSave} variant="primary"><Save size={16}/> Save Permissions</Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enable or disable access to major application modules for all users with the "Advisor" role.
            </p>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="space-y-4">
                    {moduleDisplayOrder.map(({ key, name }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
                            <ToggleSwitch
                                enabled={localPermissions.permissions[key] || false}
                                onChange={(value) => handleToggle(key, value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- NEW: Combined Gift Management Component ---
const GiftManager: React.FC<{
    items: GiftMaster[];
    onUpdate: (items: GiftMaster[]) => void;
    mappings: GiftMapping[];
    onUpdateMappings: (mappings: GiftMapping[]) => void;
    addToast: MasterDataProps['addToast'];
}> = ({ items: gifts, onUpdate: onUpdateGifts, mappings: giftMappings, onUpdateMappings: onUpdateGiftMappings, addToast }) => {
    const [newGiftName, setNewGiftName] = useState('');
    const [editingGift, setEditingGift] = useState<GiftMaster | null>(null);
    const [localMappings, setLocalMappings] = useState<GiftMapping[]>(giftMappings);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    useEffect(() => {
        setLocalMappings(giftMappings);
    }, [giftMappings]);
    
    const sortedGifts = useMemo(() => {
        return [...gifts].sort((a,b) => (a.order || 0) - (b.order || 0));
    }, [gifts]);

    const handleAddGift = () => {
        if (!newGiftName.trim()) {
            addToast('Gift name cannot be empty.', 'error');
            return;
        }
        if (gifts.some(g => g.name.toLowerCase() === newGiftName.trim().toLowerCase())) {
            addToast('A gift with this name already exists.', 'error');
            return;
        }
        const newGift: GiftMaster = {
            id: `gift-${Date.now()}`,
            name: newGiftName.trim(),
            active: true,
            order: gifts.length,
        };
        onUpdateGifts([...gifts, newGift]);
        setNewGiftName('');
    };
    
    const handleUpdateGift = () => {
        if (!editingGift || !editingGift.name.trim()) return;
        onUpdateGifts(gifts.map(g => g.id === editingGift.id ? editingGift : g));
        setEditingGift(null);
    };

    const handleToggleGift = (giftId: string) => {
        onUpdateGifts(gifts.map(g => g.id === giftId ? { ...g, active: g.active === false ? true : false } : g));
    };

    const handleMappingChange = (tier: Member['memberType'], giftId: string) => {
        const newMappings = localMappings.map(m =>
            m.tier === tier ? { ...m, giftId: giftId || null } : m
        );
        setLocalMappings(newMappings);
    };
    
    const handleSaveChanges = () => {
        onUpdateGiftMappings(localMappings);
        addToast('Gift mappings saved!', 'success');
    };

    const tiers: Member['memberType'][] = ['Silver', 'Gold', 'Diamond', 'Platinum'];

    // Drag handlers
    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        setDraggedItemId(id);
    };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedItemId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...gifts];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);
        
        const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));
        onUpdateGifts(reorderedItems);
    };
    const handleDragEnd = () => setDraggedItemId(null);
    
    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Gift Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-7">Manage the master list of available gifts and map them to customer tiers.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Master Gift List */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Master Gift List</h3>
                    <div className="overflow-y-auto max-h-80 pr-2">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-600">
                                    <th className="py-2 w-8"></th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                    <th className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGifts.map((gift) => (
                                    <tr 
                                        key={gift.id} 
                                        draggable
                                        onDragStart={e => handleDragStart(e, gift.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={e => handleDrop(e, gift.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`border-b dark:border-gray-700/50 cursor-move ${draggedItemId === gift.id ? 'opacity-50' : ''} ${gift.active === false ? 'opacity-50' : ''}`}
                                    >
                                        <td className="py-2"><GripVertical size={16} className="text-gray-400" /></td>
                                        <td className="py-2">
                                            {editingGift?.id === gift.id ? (
                                                <Input value={editingGift.name} onChange={e => setEditingGift({...editingGift, name: e.target.value})} className="!py-1" />
                                            ) : (
                                                <span className={`${gift.active === false ? 'line-through' : ''}`}>{gift.name}</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <ToggleSwitch enabled={gift.active !== false} onChange={() => handleToggleGift(gift.id)} />
                                                {editingGift?.id === gift.id ? (
                                                    <>
                                                        <Button size="small" variant="light" className="!p-1.5" onClick={() => setEditingGift(null)}><X size={14}/></Button>
                                                        <Button size="small" variant="success" className="!p-1.5" onClick={handleUpdateGift}><Save size={14}/></Button>
                                                    </>
                                                ) : (
                                                    <Button size="small" variant="light" className="!p-1.5" onClick={() => setEditingGift(gift)}><Edit2 size={14}/></Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <Input value={newGiftName} onChange={e => setNewGiftName(e.target.value)} placeholder="New gift name" />
                            <Button onClick={handleAddGift}><Plus size={16}/></Button>
                        </div>
                    </div>
                </div>

                {/* Tier Mapping */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Tier-Gift Mapping</h3>
                    <div className="space-y-4">
                        {tiers.map(tier => {
                            const mapping = localMappings.find(m => m.tier === tier);
                            return (
                                <div key={tier} className="grid grid-cols-3 items-center gap-4">
                                    <label className="font-semibold text-gray-700 dark:text-gray-300 col-span-1">{tier} Tier</label>
                                    <select
                                        value={mapping?.giftId || ''}
                                        onChange={e => handleMappingChange(tier, e.target.value)}
                                        className="col-span-2 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">-- No Gift --</option>
                                        {gifts.filter(g => g.active !== false).map(gift => (
                                            <option key={gift.id} value={gift.id}>{gift.name}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <Button variant="primary" onClick={handleSaveChanges}><Save size={16}/> Save Mappings</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Lead Source Management Component ---
const LeadSourceManager: React.FC<{
    items: LeadSourceMaster[];
    onUpdate: (items: LeadSourceMaster[]) => void;
    addToast: MasterDataProps['addToast'];
}> = ({ items, onUpdate, addToast }) => {
    
    const [editingItem, setEditingItem] = useState<{ id: string | null, name: string, parentId: string | null }>({ id: null, name: '', parentId: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ targetId: string | null; position: 'before' | 'after' | 'on' } | null>(null);

    const openModal = (parentId: string | null, itemToEdit: LeadSourceMaster | null = null) => {
        if (itemToEdit) {
            setEditingItem({ id: itemToEdit.id, name: itemToEdit.name, parentId: itemToEdit.parentId });
        } else {
            setEditingItem({ id: null, name: '', parentId });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingItem.name.trim()) {
            addToast('Source name cannot be empty.', 'error');
            return;
        }

        let updatedItems;
        if (editingItem.id) { // Update
            updatedItems = items.map(i => i.id === editingItem.id ? { ...i, name: editingItem.name, parentId: editingItem.parentId } : i);
        } else { // Create
            const siblings = items.filter(i => i.parentId === editingItem.parentId);
            const newItem: LeadSourceMaster = {
                id: `ls-${Date.now()}`,
                name: editingItem.name.trim(),
                parentId: editingItem.parentId,
                active: true,
                order: siblings.length,
            };
            updatedItems = [...items, newItem];
        }
        onUpdate(updatedItems);
        setIsModalOpen(false);
    };
    
    const handleToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? {...i, active: i.active === false ? true : false } : i));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sourceId: string) => {
        e.stopPropagation();
        e.dataTransfer.setData('sourceId', sourceId);
        setDraggedItemId(sourceId);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setDraggedItemId(null);
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItemId || draggedItemId === targetId) {
            setDropIndicator(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const dropY = e.clientY - rect.top;
        const height = rect.height;

        if (dropY < height * 0.25) {
            setDropIndicator({ targetId, position: 'before' });
        } else if (dropY > height * 0.75) {
            setDropIndicator({ targetId, position: 'after' });
        } else {
            setDropIndicator({ targetId, position: 'on' });
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDropIndicator(null);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = e.dataTransfer.getData('sourceId');
        const indicator = dropIndicator;
    
        setDraggedItemId(null);
        setDropIndicator(null);
    
        if (!sourceId || !indicator || sourceId === indicator.targetId) {
            return;
        }
    
        const sourceItem = items.find(i => i.id === sourceId);
        if (!sourceItem) return;
    
        let currentParentId = indicator.targetId;
        while (currentParentId) {
            if (currentParentId === sourceId) {
                addToast("Cannot move an item into its own descendant.", "error");
                return;
            }
            currentParentId = items.find(i => i.id === currentParentId)?.parentId || null;
        }
    
        const sourceParentId = sourceItem.parentId;
    
        let newParentId: string | null;
        if (indicator.position === 'on' && indicator.targetId) {
            newParentId = indicator.targetId;
        } else {
            const targetItem = items.find(i => i.id === indicator.targetId);
            newParentId = targetItem ? targetItem.parentId : null;
        }
    
        let tempItems = items.map(i => i.id === sourceId ? { ...i, parentId: newParentId } : i);
    
        const siblings = tempItems.filter(i => i.parentId === newParentId && i.id !== sourceId)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0));
    
        let targetIndex: number;
        if (indicator.position === 'on') {
            targetIndex = siblings.length;
        } else if (indicator.targetId) {
            targetIndex = siblings.findIndex(i => i.id === indicator.targetId);
            if (indicator.position === 'after') {
                targetIndex++;
            }
        } else {
            targetIndex = siblings.length;
        }
    
        siblings.splice(targetIndex, 0, { ...sourceItem, parentId: newParentId });
    
        const reorderedSiblings = siblings.map((item, index) => ({ ...item, order: index }));
    
        let finalItems = tempItems.filter(i => i.parentId !== newParentId || i.id === sourceId);
        finalItems = finalItems.map(item => {
            const reordered = reorderedSiblings.find(s => s.id === item.id);
            return reordered || item;
        });
    
        if (sourceParentId !== newParentId) {
            const oldSiblings = finalItems
                .filter(i => i.parentId === sourceParentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((item, index) => ({ ...item, order: index }));
            
            finalItems = finalItems.filter(i => i.parentId !== sourceParentId);
            finalItems.push(...oldSiblings);
        }
    
        onUpdate(finalItems);
        addToast('Lead source hierarchy updated.', 'success');
    };

    const Node: React.FC<{ source: LeadSourceMaster, level: number }> = ({ source, level }) => {
        const children = items.filter(i => i.parentId === source.id).sort((a,b) => (a.order || 0) - (b.order || 0));

        const isDropTargetOn = dropIndicator?.targetId === source.id && dropIndicator.position === 'on';
        const isDropTargetBefore = dropIndicator?.targetId === source.id && dropIndicator.position === 'before';
        const isDropTargetAfter = dropIndicator?.targetId === source.id && dropIndicator.position === 'after';
        
        return (
            <div className="relative">
                {isDropTargetBefore && <div className="h-1 bg-brand-primary rounded-full mx-2 my-1"></div>}
                <div 
                    draggable 
                    onDragStart={e => handleDragStart(e, source.id)} 
                    onDragEnd={handleDragEnd} 
                    onDragOver={e => handleDragOver(e, source.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, source.id)}
                    className={`flex items-center gap-2 p-2 rounded-md border-2 transition-colors ${
                        isDropTargetOn ? 'border-brand-primary bg-blue-100 dark:bg-blue-900/50' : 'border-transparent'
                    } ${source.active === false ? 'opacity-50' : ''} ${draggedItemId === source.id ? 'opacity-30' : ''}`}
                >
                    {level > 0 && <CornerDownRight size={16} className="text-gray-400" style={{ marginLeft: `${(level - 1) * 20}px` }}/>}
                    <span className="flex-grow font-medium text-gray-800 dark:text-gray-200" style={{ marginLeft: `${level === 0 ? 0 : 4}px` }}>{source.name}</span>
                    <ToggleSwitch enabled={source.active !== false} onChange={() => handleToggle(source.id)} />
                    <Button size="small" variant="light" className="!p-1.5" onClick={() => openModal(source.id)}><Plus size={14}/></Button>
                    <Button size="small" variant="light" className="!p-1.5" onClick={() => openModal(source.parentId, source)}><Edit2 size={14}/></Button>
                </div>
                 {isDropTargetAfter && <div className="h-1 bg-brand-primary rounded-full mx-2 my-1"></div>}

                {children.map(child => <Node key={child.id} source={child} level={level + 1} />)}
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Lead Source Management</h3>
                <Button onClick={() => openModal(null)} variant="primary"><Plus size={16}/> Add Root Source</Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Build a hierarchy of your lead sources. Drag and drop a source onto another to create sub-sources, or between sources to reorder.
            </p>
            <div 
                onDragOver={e => handleDragOver(e, null)} 
                onDrop={e => handleDrop(e, null)}
                onDragLeave={handleDragLeave}
                className={`p-4 border-2 border-dashed dark:border-gray-700 rounded-lg max-h-[70vh] overflow-y-auto space-y-1 min-h-[10rem] transition-colors ${
                    dropIndicator?.targetId === null ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                }`}
            >
                {items.filter(i => i.parentId === null).sort((a,b) => (a.order || 0) - (b.order || 0)).map(root => <Node key={root.id} source={root} level={0} />)}
            </div>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                     <div className="p-6">
                         <h2 className="text-xl font-bold text-brand-dark dark:text-white">{editingItem.id ? 'Edit' : 'Add'} Lead Source</h2>
                         {editingItem.parentId && <p className="text-sm text-gray-500">Adding as a sub-source to "{items.find(i => i.id === editingItem.parentId)?.name}"</p>}
                     </div>
                      <div className="p-6 overflow-y-auto flex-grow">
                          <Input 
                              label="Source Name"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                          />
                      </div>
                      <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                          <Button variant="primary" onClick={handleSave}>Save</Button>
                      </div>
                 </Modal>
            )}
        </div>
    );
};


// --- Generic Manager for Simple Lists ---
const GenericMasterManager: React.FC<{
    title: string;
    items: any[];
    onUpdate: (items: any[]) => void;
    addToast: MasterDataProps['addToast'];
    noun: string;
    dependencyCheck?: (itemId: string) => Member[];
    extraFields?: {
        label: string;
        field: string;
        type: 'select';
        options: {value: string; label: string}[];
    }[];
    reorderable?: boolean;
}> = ({ title, items, onUpdate, addToast, noun, dependencyCheck, extraFields, reorderable = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<{id: string, name: string} | null>(null);
    const [dependentMembers, setDependentMembers] = useState<Member[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    
    // Drag and Drop State
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const filteredItems = useMemo(() => 
        items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    , [items, searchQuery]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const sortedItems = useMemo(() => {
        const sortableItems = [...filteredItems];
        if (reorderable) {
            return sortableItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                const dir = sortConfig.direction === 'asc' ? 1 : -1;

                if (aValue === null || aValue === undefined) return 1 * dir;
                if (bValue === null || bValue === undefined) return -1 * dir;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * dir;
                }
                
                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (aValue === bValue) ? 0 : aValue ? -1 * dir : 1 * dir;
                }

                if (aValue < bValue) return -1 * dir;
                if (aValue > bValue) return 1 * dir;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredItems, reorderable, sortConfig]);

    const openModal = (item: any | null) => {
        setEditingItem(item ? { ...item } : { id: '', name: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!editingItem || !editingItem.name.trim()) {
            return addToast(`${noun} name cannot be empty.`, 'error');
        }

        if (editingItem.id) { // Update
            onUpdate(items.map(i => i.id === editingItem.id ? editingItem : i));
            addToast(`${noun} updated successfully.`, 'success');
        } else { // Create
            if (items.some(i => i.name.toLowerCase() === editingItem.name.trim().toLowerCase())) {
                return addToast(`This ${noun} already exists.`, 'error');
            }
            const prefix = noun.toLowerCase().split(' ').map(s => s[0]).join(''); // "Referral Type" -> "rt"
            const newId = `${prefix}-${Date.now()}`;

            onUpdate([...items, { ...editingItem, id: newId, name: editingItem.name.trim(), active: true, order: items.length }]);
            addToast(`${noun} added successfully.`, 'success');
        }
        closeModal();
    };
    
    const performToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? { ...i, active: i.active === false ? true : false } : i));
    };

    const handleDelete = (id: string) => {
        if (window.confirm(`Are you sure you want to delete this ${noun}? This action cannot be undone.`)) {
            onUpdate(items.filter(i => i.id !== id));
            addToast(`${noun} deleted successfully.`, 'success');
        }
    };

    const handleToggle = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item || item.active === false) { // No check needed for re-activation
            performToggle(id);
            return;
        }

        if (dependencyCheck) {
            const dependents = dependencyCheck(id);
            if (dependents.length > 0) {
                setItemToToggle(item);
                setDependentMembers(dependents);
                setIsWarningModalOpen(true);
            } else {
                performToggle(id);
            }
        } else {
            performToggle(id);
        }
    };

    const confirmDeactivation = () => {
        if (itemToToggle) {
            performToggle(itemToToggle.id);
        }
        setIsWarningModalOpen(false);
        setItemToToggle(null);
        setDependentMembers([]);
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        setDraggedItemId(id);
    };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedItemId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...items];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);
        
        const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));

        onUpdate(reorderedItems);
    };
    const handleDragEnd = () => setDraggedItemId(null);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <form onSubmit={(e) => e.preventDefault()} className="relative flex-grow w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                    <Input
                        type="search"
                        placeholder={`Search ${noun}s by Name or ID...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </form>
                <Button onClick={() => openModal(null)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                    <Plus size={16}/> Add New {noun}
                </Button>
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            {reorderable && <th className="px-2 py-3"></th>}
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase w-16">ID</th>
                            <SortableHeader sortKey="id" label="Code" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            <SortableHeader sortKey="name" label="Name" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            <SortableHeader sortKey="active" label="Status" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedItems.map((item, index) => (
                            <tr 
                                key={item.id} 
                                draggable={reorderable}
                                onDragStart={e => reorderable && handleDragStart(e, item.id)}
                                onDragOver={e => reorderable && handleDragOver(e)}
                                onDrop={e => reorderable && handleDrop(e, item.id)}
                                onDragEnd={() => reorderable && handleDragEnd()}
                                className={`transition-all ${item.active === false ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''} ${reorderable ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-move' : ''}`}
                            >
                                {reorderable && <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>}
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono">{item.id}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{item.name}</td>
                                <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={item.active !== false} onChange={() => handleToggle(item.id)} /></td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-600" aria-label={`Edit ${item.name}`}><Edit2 size={16}/></button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600" aria-label={`Delete ${item.name}`}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredItems.length === 0 && <div className="p-8 text-center text-gray-500">No {noun}s found.</div>}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                contentClassName="bg-white dark:bg-[#2D3748] p-8 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingItem?.id ? 'Edit' : 'Add'} {noun}</h2>
                    <div className="space-y-4">
                        <Input
                            label={`${noun} Name`}
                            value={editingItem?.name || ''}
                            onChange={e => setEditingItem((prev: any) => prev ? {...prev, name: e.target.value} : null)}
                            className={modalInputClasses}
                        />
                        {extraFields?.map(field => (
                            <div key={field.field}>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                                <select
                                    value={editingItem?.[field.field] || ''}
                                    onChange={e => setEditingItem((prev: any) => prev ? {...prev, [field.field]: e.target.value} : null)}
                                    className={modalInputClasses}
                                >
                                    <option value="">Select...</option>
                                    {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="success">Save</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Deactivate "{itemToToggle?.name}"?
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This item is currently used by <strong>{dependentMembers.length} client(s)</strong>. Deactivating it may cause data inconsistencies or issues in client profiles.
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Used by: {dependentMembers.slice(0, 3).map(m => m.name).join(', ')}{dependentMembers.length > 3 ? ', and others.' : '.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button variant="danger" onClick={confirmDeactivation}>
                        Confirm Deactivation
                    </Button>
                    <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                        Cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

const SchemeCompanyDataTable: React.FC<{
    title: string;
    items: SchemeMaster[];
    onReorder: (reorderedItems: SchemeMaster[]) => void;
    onAddItem: () => void;
    onEditItem: (item: SchemeMaster) => void;
    onToggleItem: (id: string) => void;
    search: string;
    onSearch: (query: string) => void;
    noun: string;
}> = ({ title, items, onReorder, onAddItem, onEditItem, onToggleItem, search, onSearch, noun }) => {
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [items]);

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        setDraggedItemId(id);
    };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedItemId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...sortedItems];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);
        
        const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));
        onReorder(reorderedItems);
    };
    const handleDragEnd = () => setDraggedItemId(null);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <div className="relative flex-grow w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                        type="search"
                        placeholder={`Search ${noun}s...`}
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </div>
                <Button onClick={onAddItem} variant="primary" className="w-full md:w-auto flex-shrink-0">
                    <Plus size={16}/> Add New {noun}
                </Button>
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-2 py-3"></th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedItems.map((item, index) => (
                            <tr 
                                key={item.id} 
                                draggable
                                onDragStart={e => handleDragStart(e, item.id)}
                                onDragOver={handleDragOver}
                                onDrop={e => handleDrop(e, item.id)}
                                onDragEnd={handleDragEnd}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-move ${item.active === false ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''}`}
                            >
                                <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{item.name}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.generalInsuranceType ? `${item.type} (${item.generalInsuranceType})` : item.type}</td>
                                <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={item.active !== false} onChange={() => onToggleItem(item.id)} /></td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEditItem(item)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-600" aria-label={`Edit ${item.name}`}><Edit2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {items.length === 0 && <div className="p-8 text-center text-gray-500">No {noun}s found for this company.</div>}
            </div>
        </div>
    );
};


const SchemesAndMappingsManager: React.FC<MasterDataProps> = (props) => {
    const { schemes, onUpdateSchemes, companies, onUpdateCompanies, addToast, documentMasters, schemeDocumentMappings, onUpdateSchemeDocumentMappings, allMembers, insuranceTypes } = props;
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
    const [editingScheme, setEditingScheme] = useState<SchemeMaster | null>(null);
    const [schemeFormData, setSchemeFormData] = useState<Partial<SchemeMaster>>({});
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [companySearch, setCompanySearch] = useState('');
    const [schemeSearch, setSchemeSearch] = useState('');
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<{id: string, name: string, type: 'Company' | 'Scheme'} | null>(null);
    const [dependentMembers, setDependentMembers] = useState<Member[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    
    const filteredCompanies = useMemo(() => companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()) || c.id.toLowerCase().includes(companySearch.toLowerCase())), [companies, companySearch]);
    
    const schemesForSelectedCompany = useMemo(() => {
        if (!selectedCompanyId) return [];
        return schemes.filter(s => 
            s.companyId === selectedCompanyId && 
            (s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.id.toLowerCase().includes(schemeSearch.toLowerCase()))
        );
    }, [schemes, selectedCompanyId, schemeSearch]);

    const openCompanyModal = (company: Company | null) => {
        setEditingCompany(company ? {...company} : {id: '', name: '', companyCode: '', active: true});
        setIsCompanyModalOpen(true);
    };
    const saveCompany = () => {
        if(!editingCompany || !editingCompany.name.trim()) return addToast('Company name is required.', 'error');
        if(!editingCompany.companyCode.trim()) return addToast('Company code is required.', 'error');
        if (editingCompany.id) {
            onUpdateCompanies(companies.map(c => c.id === editingCompany.id ? editingCompany : c));
        } else {
            onUpdateCompanies([...companies, { ...editingCompany, id: `comp-${Date.now()}` }]);
        }
        setIsCompanyModalOpen(false);
    };
    const performCompanyToggle = (id: string) => {
        onUpdateCompanies(companies.map(c => c.id === id ? { ...c, active: c.active === false ? true : false } : c));
    };
    const toggleCompany = (id: string) => {
        const company = companies.find(c => c.id === id);
        if (!company || company.active === false) {
            performCompanyToggle(id);
            return;
        }

        const companySchemes = schemes.filter(s => s.companyId === id);
        const dependents = allMembers.filter(m => m.policies.some(p => companySchemes.some(cs => cs.name === p.schemeName)));
        
        if (dependents.length > 0) {
            setItemToToggle({ id, name: company.name, type: 'Company' });
            setDependentMembers(dependents);
            setIsWarningModalOpen(true);
        } else {
            performCompanyToggle(id);
        }
    };

    const openSchemeModal = (scheme: SchemeMaster | null) => {
        const initialData = scheme ? {...scheme} : { name: '', companyId: selectedCompanyId || '', type: 'Health Insurance' as ConcretePolicyType, active: true };
        setEditingScheme(scheme);
        setSchemeFormData(initialData);
        setSelectedDocIds(scheme ? schemeDocumentMappings.filter(m => m.schemeId === scheme.id).map(m => m.documentId) : []);
        setIsSchemeModalOpen(true);
    };
    const saveScheme = () => {
        if (!schemeFormData.name?.trim() || !schemeFormData.companyId) return addToast('Scheme Name and Company are required.', 'error');
        if (!schemeFormData.type) return addToast('Policy Type is required.', 'error');
        const schemeToSave = { ...schemeFormData, name: schemeFormData.name.trim() };
        if (schemeToSave.id) { // Update
            onUpdateSchemes(schemes.map(s => s.id === schemeToSave.id ? s as SchemeMaster : s));
        } else { // Create
            schemeToSave.id = `scheme-${Date.now()}`;
            schemeToSave.order = schemes.filter(s => s.companyId === schemeToSave.companyId).length;
            onUpdateSchemes([...schemes, schemeToSave as SchemeMaster]);
        }
        const otherMappings = schemeDocumentMappings.filter(m => m.schemeId !== schemeToSave.id);
        const newMappings = selectedDocIds.map(docId => ({ schemeId: schemeToSave.id!, documentId: docId }));
        onUpdateSchemeDocumentMappings([...otherMappings, ...newMappings]);
        setIsSchemeModalOpen(false);
    };
    const performSchemeToggle = (id: string) => onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: s.active === false ? true : false } : s));
    const toggleScheme = (id: string) => {
        const scheme = schemes.find(s => s.id === id);
        if (!scheme || scheme.active === false) {
            performSchemeToggle(id);
            return;
        }
        const dependents = allMembers.filter(m => m.policies.some(p => p.schemeName === scheme.name));
        if (dependents.length > 0) {
            setItemToToggle({ id, name: scheme.name, type: 'Scheme' });
            setDependentMembers(dependents);
            setIsWarningModalOpen(true);
        } else {
            performSchemeToggle(id);
        }
    };

    const handleSchemeReorder = (reorderedSchemesForCompany: SchemeMaster[]) => {
        const reorderedMap = new Map(reorderedSchemesForCompany.map(s => [s.id, s]));
        const updatedSchemes = schemes.map(scheme => {
            return reorderedMap.get(scheme.id) || scheme;
        });
        onUpdateSchemes(updatedSchemes);
    };

    const confirmDeactivation = () => {
        if (itemToToggle?.type === 'Company') {
            performCompanyToggle(itemToToggle.id);
        } else if (itemToToggle?.type === 'Scheme') {
            performSchemeToggle(itemToToggle.id);
        }
        setIsWarningModalOpen(false);
        setItemToToggle(null);
        setDependentMembers([]);
    };

    return (<div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="lg:w-2/5 xl:w-1/3 flex flex-col h-full">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Companies</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        className="block w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Search Companies..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto border dark:border-gray-700 rounded-lg -mr-2 pr-2">
                 {filteredCompanies.map(company => (
                    <button 
                        key={company.id} 
                        onClick={() => setSelectedCompanyId(company.id)}
                        className={`w-full text-left p-3 my-1 rounded-lg border-l-4 transition-colors duration-200 ${
                            selectedCompanyId === company.id 
                            ? 'bg-blue-100 dark:bg-blue-900/50 border-brand-primary' 
                            : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } ${company.active === false ? 'opacity-60' : ''}`}
                    >
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <span className="font-semibold text-gray-900 dark:text-gray-200 block">{company.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block font-mono">{company.companyCode}</span>
                            </div>
                            <ChevronRight size={16} className={`transition-transform ${selectedCompanyId === company.id ? 'text-brand-primary' : 'text-gray-400'}`} />
                        </div>
                    </button>
                ))}
            </div>
            <Button onClick={() => openCompanyModal(null)} variant="light" className="w-full mt-4"><Plus size={16}/> Add New Company</Button>
        </div>
        <div className="lg:w-3/5 xl:w-2/3 flex flex-col h-full">
             {selectedCompanyId ? (
                <SchemeCompanyDataTable
                    title={`Schemes for ${companies.find(c => c.id === selectedCompanyId)?.name || ''}`}
                    items={schemesForSelectedCompany}
                    onReorder={handleSchemeReorder}
                    onAddItem={() => openSchemeModal(null)}
                    onEditItem={openSchemeModal}
                    onToggleItem={toggleScheme}
                    search={schemeSearch}
                    onSearch={setSchemeSearch}
                    noun="Scheme"
                />
            ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-lg">
                    <div>
                        <Building size={48} className="mx-auto text-gray-300 dark:text-gray-500"/>
                        <p className="mt-4 font-semibold">Select a company</p>
                        <p className="text-sm">Select a company from the left to view and manage its schemes.</p>
                    </div>
                </div>
            )}
        </div>

        <Modal
            isOpen={isWarningModalOpen}
            onClose={() => setIsWarningModalOpen(false)}
            contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
        >
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                        Deactivate "{itemToToggle?.name}"?
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This {itemToToggle?.type} is currently used by <strong>{dependentMembers.length} client(s)</strong>. Deactivating it may cause data inconsistencies.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Used by: {dependentMembers.slice(0, 3).map(m => m.name).join(', ')}{dependentMembers.length > 3 ? ', and others.' : '.'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                <Button variant="danger" onClick={confirmDeactivation}>Confirm Deactivation</Button>
                <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>Cancel</Button>
            </div>
        </Modal>

        {isCompanyModalOpen && (
            <Modal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); saveCompany(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingCompany?.id ? 'Edit' : 'Add'} Company</h2>
                    <div className="space-y-4">
                        <Input
                            label="Company Code"
                            value={editingCompany?.companyCode || ''}
                            onChange={e => setEditingCompany(c => c ? {...c, companyCode: e.target.value} : null)}
                            className={themeAwareInputClasses}
                        />
                        <Input
                            label="Company Name"
                            value={editingCompany?.name || ''}
                            onChange={e => setEditingCompany(c => c ? {...c, name: e.target.value} : null)}
                            className={themeAwareInputClasses}
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="success">Save</Button>
                    </div>
                </form>
            </Modal>
        )}

        {isSchemeModalOpen && (
            <Modal
                isOpen={isSchemeModalOpen}
                onClose={() => setIsSchemeModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); saveScheme(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingScheme ? 'Edit' : 'New'} Scheme</h2>
                    <div className="space-y-4">
                        <Input label="Scheme Name" value={schemeFormData.name || ''} onChange={e => setSchemeFormData(s => ({...s, name: e.target.value}))} className={themeAwareInputClasses}/>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Type</label>
                            <select 
                                value={schemeFormData.type} 
                                onChange={e => setSchemeFormData(s => ({...s, type: e.target.value as any, generalInsuranceType: e.target.value !== 'General Insurance' ? undefined : s.generalInsuranceType}))} 
                                className={themeAwareInputClasses}>
                                    <option value="" disabled>Select Type...</option>
                                    <option>Life Insurance</option>
                                    <option>Health Insurance</option>
                                    <option>General Insurance</option>
                            </select>
                        </div>
                        {schemeFormData.type === 'General Insurance' && <div className="animate-fade-in"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Insurance Sub-Type</label><select value={schemeFormData.generalInsuranceType || ''} onChange={e => setSchemeFormData(s => ({...s, generalInsuranceType: e.target.value as any}))} className={themeAwareInputClasses}><option value="">Select Sub-Type...</option>{insuranceTypes.filter(it=>it.name !== 'Life Insurance' && it.name !== 'Health Insurance').map(it => <option key={it.id} value={it.name}>{it.name}</option>)}</select></div>}
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label><select value={schemeFormData.companyId} onChange={e => setSchemeFormData(s => ({...s, companyId: e.target.value}))} className={themeAwareInputClasses} disabled={!!selectedCompanyId}><option value="">Select Company...</option>{companies.filter(c => c.active !== false).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><h4 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Documents</h4><div className="grid grid-cols-2 gap-3 p-3 bg-gray-100 dark:bg-slate-700/50 rounded-md max-h-40 overflow-y-auto">{documentMasters.filter(d=>d.active!==false).map(d => <label key={d.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedDocIds.includes(d.id)} onChange={e => setSelectedDocIds(p => e.target.checked ? [...p, d.id] : p.filter(id => id !== d.id))} className="h-4 w-4 rounded-sm border-gray-300 dark:border-gray-500 bg-white dark:bg-slate-600 text-green-500 focus:ring-green-600"/>{d.name}</label>)}</div></div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={() => setIsSchemeModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="success">Save Scheme</Button>
                    </div>
                </form>
            </Modal>
        )}
    </div>);
};

const CompanyMasterManager: React.FC<MasterDataProps> = ({ companies, onUpdateOperatingCompanies, currentUser }) => {
    const parentCompany = useMemo(() => companies.find(c => c.id === currentUser?.companyId), [companies, currentUser]);
    const [companyData, setCompanyData] = useState<Company | null>(parentCompany || null);

    useEffect(() => { setCompanyData(companies.find(c => c.id === currentUser?.companyId) || null); }, [companies, currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setCompanyData(prev => prev ? { ...prev, [name]: val } : null);
    };
    
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCompanyData(prev => prev ? { ...prev, address: { ...prev.address, [name]: value } } : null);
    };
    
    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCompanyData(prev => prev ? { ...prev, contact: { ...prev.contact, [name]: value } } : null);
    };

    const handleSave = () => {
        if (companyData) {
            onUpdateOperatingCompanies(companyData);
        }
    };
    
    if (!companyData) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Company Master</h3>
                <div className="p-8 text-center text-gray-500 border-2 border-dashed dark:border-gray-600 rounded-lg mt-4">
                    <p>No company data found for the current user.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Company Master</h3>
                <Button onClick={handleSave} variant="primary"><Save size={16}/> Save Company Details</Button>
            </div>

            <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Company Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Company Code" name="companyCode" value={companyData.companyCode || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                        <Input label="Company Name" name="name" value={companyData.name} onChange={handleInputChange} className={themeAwareInputClasses} />
                        <Input label="Mailing Name" name="mailingName" value={companyData.mailingName || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                        <Input label="Date of Creation" name="dateOfCreation" type="date" value={companyData.dateOfCreation || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <ToggleSwitch enabled={companyData.active || false} onChange={() => setCompanyData(prev => prev ? ({...prev, active: !prev.active}) : null)} />
                            <span>{companyData.active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Address & Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Line 1" name="line1" value={companyData.address?.line1 || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                        <Input label="Phone No." name="phoneNo" value={companyData.contact?.phoneNo || ''} onChange={handleContactChange} className={themeAwareInputClasses} />
                        <Input label="Line 2" name="line2" value={companyData.address?.line2 || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                        <Input label="FAX No." name="faxNo" value={companyData.contact?.faxNo || ''} onChange={handleContactChange} className={themeAwareInputClasses} />
                        <Input label="Line 3" name="line3" value={companyData.address?.line3 || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                        <Input label="Email ID" name="emailId" value={companyData.contact?.emailId || ''} onChange={handleContactChange} className={themeAwareInputClasses} />
                        <Input label="City" name="city" value={companyData.address?.city || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                        <Input label="State" name="state" value={companyData.address?.state || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                        <Input label="Pin Code" name="pinCode" value={companyData.address?.pinCode || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                    </div>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Tax Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="GSTIN" name="gstin" value={companyData.gstin || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                        <Input label="PAN" name="pan" value={companyData.pan || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                        <Input label="TAN" name="tan" value={companyData.tan || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const BranchesManager: React.FC<MasterDataProps> = ({ finrootsBranches, onUpdateFinrootsBranches, addToast, companies, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Partial<FinRootsBranch> | null>(null);
    const [branchIdSuffix, setBranchIdSuffix] = useState('');

    type SortKey = 'branchId' | 'branchName' | 'active';
    type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'branchName', direction: 'asc' });
    
    const handleSort = useCallback((key: string) => {
        setSortConfig(prev => ({
            key: key as SortKey,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const companyBranches = useMemo(() => {
        return finrootsBranches.filter(b => b.companyId === currentUser?.companyId);
    }, [finrootsBranches, currentUser]);
    
    const companyCode = useMemo(() => companies.find(c => c.id === currentUser?.companyId)?.companyCode || '', [companies, currentUser]);

    const sortedAndFilteredBranches = useMemo(() => {
        let filtered = companyBranches.filter(branch => 
            branch.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.branchId.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'asc' ? 1 : -1;
            let aValue: any;
            let bValue: any;

            switch (key) {
                case 'branchId':
                    aValue = a.branchId;
                    bValue = b.branchId;
                    break;
                case 'branchName':
                    aValue = a.branchName.toLowerCase();
                    bValue = b.branchName.toLowerCase();
                    break;
                case 'active':
                    aValue = a.active;
                    bValue = b.active;
                    break;
                default:
                    return 0;
            }
            
            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return (aValue === bValue) ? 0 : aValue ? -1 * dir : 1 * dir;
            }

            if (aValue < bValue) return -1 * dir;
            if (aValue > bValue) return 1 * dir;
            return 0;
        });

        return filtered;
    }, [companyBranches, searchQuery, sortConfig]);

    const openModal = (branch: FinRootsBranch | null) => {
        setEditingBranch(branch ? { ...branch } : { id: '', branchId: '', branchName: '', dateOfCreation: '', active: true, defaultForSync: false, companyId: currentUser!.companyId });
        setBranchIdSuffix(branch ? branch.branchId.replace(`${companyCode}-`, '') : '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingBranch(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!editingBranch || !editingBranch.branchName?.trim()) {
            return addToast(`Branch name cannot be empty.`, 'error');
        }
        if (!branchIdSuffix.trim()) {
            return addToast('Branch code suffix cannot be empty.', 'error');
        }

        const finalBranchId = `${companyCode}-${branchIdSuffix}`;
        const isDuplicate = finrootsBranches.some(b => b.id !== editingBranch.id && b.branchId === finalBranchId);
        if (isDuplicate) {
            return addToast(`Branch ID "${finalBranchId}" already exists.`, 'error');
        }

        const branchToSave = { ...editingBranch, branchId: finalBranchId };

        if (editingBranch.id) { // Update
            onUpdateFinrootsBranches(finrootsBranches.map(b => b.id === editingBranch.id ? branchToSave as FinRootsBranch : b));
            addToast(`Branch updated successfully.`, 'success');
        } else { // Create
            const newId = `frb-${Date.now()}`;
            onUpdateFinrootsBranches([...finrootsBranches, { ...(branchToSave as FinRootsBranch), id: newId }]);
            addToast(`Branch added successfully.`, 'success');
        }
        closeModal();
    };
    
    const handleToggle = (id: string) => {
        onUpdateFinrootsBranches(finrootsBranches.map(b => b.id === id ? { ...b, active: !b.active } : b));
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setEditingBranch(prev => {
            if (!prev) return null;
            return { ...prev, [name]: type === 'checkbox' ? checked : value };
        });
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditingBranch(prev => {
            if (!prev) return null;
            return { ...prev, address: { ...prev.address, [name]: value } };
        });
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Branch</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <form onSubmit={(e) => e.preventDefault()} className="relative flex-grow w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                    <Input
                        type="search"
                        placeholder={`Search Branches by Name or ID...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </form>
                <Button onClick={() => openModal(null)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                    <Plus size={16}/> Add New Branch
                </Button>
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ID</th>
                            <SortableHeader sortKey="branchId" label="Branch ID" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader sortKey="branchName" label="Branch Name" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader sortKey="active" label="Status" sortConfig={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredBranches.map((branch, index) => (
                            <tr key={branch.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${!branch.active ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono">{branch.branchId}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{branch.branchName}</td>
                                <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={branch.active || false} onChange={() => handleToggle(branch.id)} /></td>
                                <td className="px-6 py-3 whitespace-nowrap"><Button size="small" variant="light" onClick={() => openModal(branch)}><Edit2 size={14}/> Edit</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedAndFilteredBranches.length === 0 && <div className="p-8 text-center text-gray-500">No Branches found.</div>}
            </div>

            {isModalOpen && editingBranch && (
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-3xl text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingBranch?.id ? 'Edit' : 'Add'} Branch</h2>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Branch Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch ID *</label>
                                    <div className="flex items-end gap-2">
                                        <Input label="" value={companyCode} disabled />
                                        <span className="pb-2 font-bold">-</span>
                                        <Input
                                            label=""
                                            value={branchIdSuffix}
                                            onChange={e => setBranchIdSuffix(e.target.value.toUpperCase())}
                                            placeholder="e.g., ERD"
                                        />
                                    </div>
                                </div>
                                <Input label="Branch Name" name="branchName" value={editingBranch.branchName} onChange={handleInputChange} className={themeAwareInputClasses} />
                                <Input label="Date of Creation" name="dateOfCreation" type="date" value={editingBranch.dateOfCreation || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                                <div className="flex items-center gap-4 pt-6">
                                    <label className="flex items-center gap-2"><input type="checkbox" name="defaultForSync" checked={editingBranch.defaultForSync} onChange={handleInputChange} /> Default for Sync</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" name="active" checked={editingBranch.active} onChange={handleInputChange} /> Active</label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Address Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Line 1" name="line1" value={editingBranch.address?.line1 || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="State" name="state" value={editingBranch.address?.state || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="Line 2" name="line2" value={editingBranch.address?.line2 || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="Pin Code" name="pinCode" value={editingBranch.address?.pinCode || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="Line 3" name="line3" value={editingBranch.address?.line3 || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="Phone No." name="phone" value={editingBranch.address?.phone || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="City" name="city" value={editingBranch.address?.city || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                                <Input label="FAX No." name="fax" value={editingBranch.address?.fax || ''} onChange={handleAddressChange} className={themeAwareInputClasses} />
                            </div>
                        </div>
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Tax Info</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input label="GSTIN" name="gstin" value={editingBranch.gstin || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                                <Input label="PAN" name="pan" value={editingBranch.pan || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                                <Input label="TAN" name="tan" value={editingBranch.tan || ''} onChange={handleInputChange} className={themeAwareInputClasses} />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="success">Save</Button>
                    </div>
                </form>
            </Modal>
            )}
        </div>
    );
};

const GeographyManager: React.FC<{
    geographies: Geography[];
    onUpdate: (geos: Geography[]) => void;
    addToast: MasterDataProps['addToast'];
    allMembers: Member[];
}> = ({ geographies, onUpdate, addToast, allMembers }) => {
    const [editingGeo, setEditingGeo] = useState<Geography | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<Geography | null>(null);
    const [dependentMembers, setDependentMembers] = useState<Member[]>([]);

    const geoTypes: Geography['type'][] = ['Country', 'State', 'District', 'City', 'Pincode', 'Area'];
    const parentTypes: Record<Geography['type'], Geography['type'] | null> = { Country: null, State: 'Country', District: 'State', City: 'District', Area: 'City', Pincode: 'City' };
    
    const geoMap = useMemo(() => new Map(geographies.map(g => [g.id, g])), [geographies]);
    
    const filteredGeoIds = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const matchingIds = new Set<string>();
        geographies.forEach(geo => {
            if (geo.name.toLowerCase().includes(searchQuery.toLowerCase()) || geo.id.toLowerCase().includes(searchQuery.toLowerCase())) {
                matchingIds.add(geo.id);
                let current = geo;
                while (current.parentId && geoMap.has(current.parentId)) {
                    const parent = geoMap.get(current.parentId)!;
                    matchingIds.add(parent.id);
                    current = parent;
                }
            }
        });
        return matchingIds;
    }, [searchQuery, geographies, geoMap]);

    const openModal = (geo: Geography | null) => {
        setEditingGeo(geo ? {...geo} : {id: '', name: '', type: 'State', parentId: null, active: true});
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setEditingGeo(null);
        setIsModalOpen(false);
    };
    const handleSave = () => {
        if (!editingGeo || !editingGeo.name.trim()) return addToast('Name is required', 'error');
        if (parentTypes[editingGeo.type] && !editingGeo.parentId) return addToast('A parent is required for this type.', 'error');
        
        if (editingGeo.id) {
            onUpdate(geographies.map(g => g.id === editingGeo.id ? editingGeo : g));
        } else {
            onUpdate([...geographies, { ...editingGeo, id: `geo-${Date.now()}` }]);
        }
        closeModal();
    };

    const performToggle = (id: string, activate: boolean) => {
        const geoToToggle = geographies.find(g => g.id === id);
        if (!geoToToggle) return;
        
        const newGeographies = [...geographies];
        const idsToToggle = new Set<string>();
        const findChildrenRecursive = (parentId: string) => {
            idsToToggle.add(parentId);
            newGeographies.filter(g => g.parentId === parentId).forEach(child => findChildrenRecursive(child.id));
        };
        findChildrenRecursive(id);

        const updatedGeos = newGeographies.map(g => idsToToggle.has(g.id) ? { ...g, active: activate } : g);
        onUpdate(updatedGeos);
        addToast(`${activate ? 'Activated' : 'Deactivated'} ${geoToToggle.name} and all its sub-geographies.`, 'success');
    };

    const handleToggle = (id: string) => {
        const geoToToggle = geographies.find(g => g.id === id);
        if (!geoToToggle) return;
        const isBecomingActive = geoToToggle.active === false;

        if (isBecomingActive) {
            if (geoToToggle.parentId) {
                const parent = geographies.find(g => g.id === geoToToggle.parentId);
                if (parent && parent.active === false) {
                    return addToast(`Cannot activate '${geoToToggle.name}' because parent '${parent.name}' is inactive.`, 'error');
                }
            }
            performToggle(id, true);
        } else {
            const allChildrenIds = new Set<string>();
            const findChildrenRecursive = (parentId: string) => {
                allChildrenIds.add(parentId);
                geographies.filter(g => g.parentId === parentId).forEach(child => findChildrenRecursive(child.id));
            };
            findChildrenRecursive(id);

            const geoItemsToDeactivate = geographies.filter(g => allChildrenIds.has(g.id));
            const geoNamesToDeactivate = new Set(geoItemsToDeactivate.map(g => g.name));

            const dependents = allMembers.filter(member => 
                geoNamesToDeactivate.has(member.state) || (member.city && geoNamesToDeactivate.has(member.city))
            );

            if (dependents.length > 0) {
                setItemToToggle(geoToToggle);
                setDependentMembers(dependents);
                setIsWarningModalOpen(true);
            } else {
                performToggle(id, false);
            }
        }
    };

    const confirmDeactivation = () => {
        if (itemToToggle) {
            performToggle(itemToToggle.id, false);
        }
        setIsWarningModalOpen(false);
        setItemToToggle(null);
        setDependentMembers([]);
    };
    
    const renderTree = (parentId: string | null = null, level = 0) => {
        return geographies
            .filter(g => g.parentId === parentId && (!filteredGeoIds || filteredGeoIds.has(g.id)))
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(geo => (<React.Fragment key={geo.id}>
                <div className={`flex items-center gap-2 p-1.5 rounded-md ${geo.active === false ? 'opacity-50' : ''}`} style={{ paddingLeft: `${level * 20 + 6}px` }}>
                    <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{geo.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{geo.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <ToggleSwitch enabled={geo.active !== false} onChange={() => handleToggle(geo.id)} />
                        <Button size="small" variant="light" className="!p-2" onClick={() => openModal(geo)}><Edit2 size={14}/></Button>
                    </div>
                </div>
                {renderTree(geo.id, level + 1)}
            </React.Fragment>));
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Geography Management</h3>
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <form onSubmit={(e) => e.preventDefault()} className="relative flex-grow w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                        type="search"
                        placeholder="Search geographies by Name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </form>
                <Button onClick={() => openModal(null)} variant="primary" className="w-full md:w-auto"><Plus size={16}/> Add New Geography</Button>
            </div>
            <div className="flex-1 overflow-y-auto border dark:border-gray-700 rounded-lg p-2 space-y-1">
                {renderTree()}
            </div>
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-200"
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingGeo?.id ? 'Edit' : 'Add'} Geography</h2>
                        <div className="space-y-4">
                            <Input label="Name" value={editingGeo?.name || ''} onChange={e => setEditingGeo(g => g ? {...g, name: e.target.value} : null)} className={themeAwareInputClasses}/>
                            <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Type</label><select value={editingGeo?.type} onChange={e => setEditingGeo(g=> g ? {...g, type: e.target.value as any, parentId: null}: null)} className={themeAwareInputClasses}>{geoTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                            {editingGeo && parentTypes[editingGeo.type] && <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Parent ({parentTypes[editingGeo.type]})</label><select value={editingGeo.parentId || ''} onChange={e => setEditingGeo(g=> g ? {...g, parentId: e.target.value}: null)} className={themeAwareInputClasses}><option value="">Select Parent...</option>{geographies.filter(g => g.type === parentTypes[editingGeo!.type] && g.active !== false).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="success">Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
            <Modal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Deactivate "{itemToToggle?.name}"?
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This geography is used by <strong>{dependentMembers.length} client(s)</strong>. Deactivating it (and its children) may cause data inconsistencies.
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Used by: {dependentMembers.slice(0, 3).map(m => m.name).join(', ')}{dependentMembers.length > 3 ? ', and others.' : '.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button variant="danger" onClick={confirmDeactivation}>
                        Confirm Deactivation
                    </Button>
                    <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                        Cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

const PolicyConfigurationManager: React.FC<MasterDataProps> = (props) => {
    const { insuranceTypes, onUpdateInsuranceTypes, insuranceFields, onUpdateInsuranceFields, policyChecklistMasters, onUpdatePolicyChecklistMasters, addToast } = props;
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(insuranceTypes.length > 0 ? insuranceTypes[0].id : null);
    
    // BUG FIX: Automatically create root checklist items for new insurance types.
    useEffect(() => {
        const checklistRootNames = new Set(policyChecklistMasters.filter(p => !p.parentId).map(p => p.name));
        const missingRoots = insuranceTypes.filter(it => it.active && !checklistRootNames.has(it.name));

        if (missingRoots.length > 0) {
            const newRoots: PolicyChecklistMaster[] = missingRoots.map(type => ({
                id: `pcl-${type.name.toLowerCase().replace(/\s/g, '-')}-root`,
                name: type.name,
                parentId: null,
                policyType: type.name, // policyType is now a string
                active: true,
            }));
            onUpdatePolicyChecklistMasters([...policyChecklistMasters, ...newRoots]);
        }
    }, [insuranceTypes, policyChecklistMasters, onUpdatePolicyChecklistMasters]);

    const ChecklistManager: React.FC<{typeId: string}> = ({ typeId }) => {
        const selectedType = insuranceTypes.find(it => it.id === typeId);
        if (!selectedType) return null;
        
        const typeChecklistRoot = policyChecklistMasters.find(p => p.name === selectedType.name && !p.parentId);

        const items = policyChecklistMasters.filter(p => p.parentId === typeChecklistRoot?.id);
        
        const handleUpdate = (newItems: any[]) => {
            const itemsToKeep = policyChecklistMasters.filter(p => p.parentId !== typeChecklistRoot?.id);
            
            const updatedCategoryItems = newItems.map(item => {
                const { name, ...rest } = item;
                return {
                    ...rest,
                    name: name,
                    parentId: typeChecklistRoot!.id,
                    policyType: selectedType.name
                }
            });

            const finalMasterList = [...itemsToKeep, ...updatedCategoryItems];
            onUpdatePolicyChecklistMasters(finalMasterList);
        };

        return (
            <GenericMasterManager 
                reorderable={true}
                title={`Checklist for ${selectedType.name}`}
                items={items}
                onUpdate={handleUpdate}
                addToast={addToast}
                noun="Checklist Item"
            />
        );
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Policy Configuration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage insurance types, their data fields, and document checklists.</p>
            
            <div className="mb-6">
                <GenericMasterManager 
                    title="Manage Insurance Types"
                    items={insuranceTypes}
                    onUpdate={onUpdateInsuranceTypes}
                    addToast={addToast}
                    noun="Insurance Type"
                    extraFields={[{
                        label: 'Business Vertical',
                        field: 'verticalId',
                        type: 'select',
                        options: props.businessVerticals.map(bv => ({ value: bv.id, label: bv.name }))
                    }]}
                />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Configure Fields & Checklists</h4>
                <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg mb-4 overflow-x-auto">
                    {insuranceTypes.filter(it => it.active).map(type => (
                        <button key={type.id} onClick={() => setSelectedTypeId(type.id)}
                            className={`flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${selectedTypeId === type.id ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                            {type.name}
                        </button>
                    ))}
                </div>

                {selectedTypeId && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div>
                            <GenericMasterManager
                                reorderable={true}
                                title={`Fields for ${insuranceTypes.find(it => it.id === selectedTypeId)?.name}`}
                                items={insuranceFields.filter(f => f.insuranceTypeId === selectedTypeId).map(f => ({ ...f, name: f.label }))}
                                onUpdate={(newItemsForType) => {
                                    const otherFields = insuranceFields.filter(f => f.insuranceTypeId !== selectedTypeId);
                                    
                                    const finalNewFields = newItemsForType.map((item: any) => {
                                        const { name, ...rest } = item;

                                        const toCamelCase = (s: string) => s.replace(/[^a-zA-Z0-9 ]/g, "")
                                            .replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase())
                                            .replace(/ /g, "");

                                        return {
                                            ...rest,
                                            label: name,
                                            fieldName: rest.fieldName || toCamelCase(name),
                                            insuranceTypeId: selectedTypeId,
                                            fieldType: rest.fieldType || 'text',
                                            active: rest.active !== false,
                                            order: rest.order !== undefined ? rest.order : 0,
                                        };
                                    });
                                    
                                    onUpdateInsuranceFields([...otherFields, ...finalNewFields] as InsuranceFieldMaster[]);
                                }}
                                addToast={addToast}
                                noun="Field"
                            />
                        </div>
                        <ChecklistManager key={selectedTypeId} typeId={selectedTypeId} />
                    </div>
                )}
            </div>
        </div>
    );
};


export const MasterData: React.FC<MasterDataProps> = (props) => {
    const [activeTab, setActiveTab] = useState<string>('companyMaster');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const mobileNavRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
                setIsMobileNavOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const navItems = [
        { id: 'companyMaster', label: 'Company Master', icon: <Building size={18}/> },
        { id: 'branches', label: 'Branch', icon: <GitBranch size={18}/> },
        { id: 'businessVerticals', label: 'Business Vertical', icon: <Briefcase size={18}/> },
        { id: 'policyConfiguration', label: 'Policy Configuration', icon: <SlidersHorizontal size={18}/>},
        { id: 'schemesAndMappings', label: 'Scheme and Mappings', icon: <FileTextIcon size={18}/> },
        { id: 'leadSources', label: 'Lead/Referral', icon: <Users size={18}/> },
        { id: 'geography', label: 'Geography', icon: <MapPin size={18}/> },
        { id: 'documentMasters', label: 'Document Master', icon: <FileTextIcon size={18}/> },
        { id: 'bankMasters', label: 'Bank Master', icon: <Building size={18} /> },
        { id: 'taskStatuses', label: 'Task Status', icon: <CheckSquare size={18}/> },
        { id: 'customerSegments', label: 'Customer Segment', icon: <Users size={18}/> },
        { id: 'taskMasters', label: 'Task Master', icon: <CheckSquare size={18}/> },
        { id: 'giftMasters', label: 'Gift Management', icon: <Gift size={18}/> },
        { id: 'routes', label: 'Routes', icon: <LinkIcon size={18}/> },
        { id: 'rolePermissions', label: 'Role Permissions', icon: <Lock size={18} /> },


    ];
    
    const activeLabel = useMemo(() => 
        navItems.find(item => item.id === activeTab)?.label || 'Select a category',
    [activeTab, navItems]);
    
    const renderContent = () => {
        switch(activeTab) {
            case 'companyMaster': return <CompanyMasterManager {...props} />;
            case 'branches': return <BranchesManager {...props} />;
            case 'rolePermissions': return <RolePermissionsManager permissions={props.rolePermissions} onSave={props.onUpdateRolePermissions} addToast={props.addToast} />;
            case 'policyConfiguration': return <PolicyConfigurationManager {...props} />;
            case 'businessVerticals': return <GenericMasterManager key="businessVerticals" title="Manage Business Verticals" items={props.businessVerticals} onUpdate={props.onUpdateBusinessVerticals} addToast={props.addToast} noun="Business Vertical" reorderable={true}/>;
            case 'leadSources': return <LeadSourceManager items={props.leadSources} onUpdate={props.onUpdateLeadSources} addToast={props.addToast} />;
            case 'schemesAndMappings': return <SchemesAndMappingsManager {...props} />;
            case 'geography': return <GeographyManager geographies={props.geographies} onUpdate={props.onUpdateGeographies} addToast={props.addToast} allMembers={props.allMembers} />;
            case 'documentMasters': return <GenericMasterManager key="documentMasters" title="Manage Document Masters" items={props.documentMasters} onUpdate={props.onUpdateDocumentMasters} addToast={props.addToast} noun="Document" reorderable={true}/>;
            case 'giftMasters': return <GiftManager items={props.giftMasters} onUpdate={props.onUpdateGiftMasters} mappings={props.giftMappings} onUpdateMappings={props.onUpdateGiftMappings} addToast={props.addToast} />;
            case 'taskStatuses': return <GenericMasterManager key="taskStatuses" title="Manage Task Statuses" items={props.taskStatuses} onUpdate={props.onUpdateTaskStatuses} addToast={props.addToast} noun="Task Status" reorderable={true}/>;
            case 'routes':
                return <GenericMasterManager 
                    key="routes" 
                    title="Manage Routes" 
                    items={props.routes} 
                    onUpdate={props.onUpdateRoutes} 
                    addToast={props.addToast} 
                    noun="Route" 
                    reorderable={true} 
                />;
            case 'customerSegments': return (
                <div className="space-y-8">
                    <GenericMasterManager 
                        title="Manage Customer Categories" 
                        items={props.customerCategories} 
                        onUpdate={props.onUpdateCustomerCategories} 
                        addToast={props.addToast} 
                        noun="Customer Category"
                        dependencyCheck={(id) => props.allMembers.filter(m => m.customerCategoryId === id)}
                        reorderable={true}
                    />
                    <GenericMasterManager 
                        title="Manage Customer Sub-Categories" 
                        items={props.customerSubCategories} 
                        onUpdate={props.onUpdateCustomerSubCategories} 
                        addToast={props.addToast} 
                        noun="Customer Sub-Category"
                        dependencyCheck={(id) => props.allMembers.filter(m => m.customerSubCategoryId === id)}
                        extraFields={[{
                            label: 'Parent Category',
                            field: 'parentId',
                            type: 'select',
                            options: props.customerCategories.map(c => ({ value: c.id, label: c.name }))
                        }]}
                        reorderable={true}
                    />
                    <GenericMasterManager 
                        title="Manage Customer Groups" 
                        items={props.customerGroups} 
                        onUpdate={props.onUpdateCustomerGroups} 
                        addToast={props.addToast} 
                        noun="Customer Group"
                        dependencyCheck={(id) => props.allMembers.filter(m => m.customerGroupId === id)}
                        reorderable={true}
                    />
                </div>
            );
            case 'taskMasters': return (
                <div className="space-y-8">
                    <GenericMasterManager 
                        title="Manage Task Masters (Types)" 
                        items={props.taskMasters} 
                        onUpdate={props.onUpdateTaskMasters} 
                        addToast={props.addToast} 
                        noun="Task Master"
                        reorderable={true}
                    />
                    <GenericMasterManager 
                        title="Manage Sub-Task Masters (Templates)" 
                        items={props.subTaskMasters} 
                        onUpdate={props.onUpdateSubTaskMasters} 
                        addToast={props.addToast} 
                        noun="Sub-Task Master"
                         extraFields={[{
                            label: 'Parent Task Type',
                            field: 'taskMasterId',
                            type: 'select',
                            options: props.taskMasters.map(t => ({ value: t.id, label: t.name }))
                        }]}
                        reorderable={true}
                    />
                </div>
            );
            case 'bankMasters': 
                return <GenericMasterManager 
                    key="bankMasters" 
                    reorderable={true}
                    title="Manage Bank Masters" 
                    items={props.bankMasters.map(b => ({ id: b.id, name: b.bankName, active: b.active, order: b.order }))} 
                    onUpdate={(updatedItems) => {
                        const originalBanksMap = new Map(props.bankMasters.map(b => [b.id, b]));
                        const newBankMasters = updatedItems.map(item => {
                            const originalBank = originalBanksMap.get(item.id);
                            if (originalBank) {
                                return { ...originalBank, bankName: item.name, active: item.active !== false, order: item.order };
                            } else {
                                return {
                                    id: item.id,
                                    bankCode: `NEW-${item.id}`,
                                    bankName: item.name,
                                    branchName: 'Default Branch',
                                    active: item.active !== false,
                                    accountType: '',
                                    accountNumber: '',
                                    order: item.order,
                                } as BankMaster;
                            }
                        });
                        props.onUpdateBankMasters(newBankMasters);
                    }} 
                    addToast={props.addToast} 
                    noun="Bank" 
                    dependencyCheck={(id) => { 
                        const item = props.bankMasters.find(b => b.id === id); 
                        if (!item) return []; 
                        return props.allMembers.filter(m => m.bankDetails?.bankName === item.bankName); 
                    }} 
                />;
            default: return <div className="text-center p-8 text-gray-500">Select an item from the sidebar to manage it.</div>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 md:h-full">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-full md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex-col">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Database/> Master Data</h2>
                <nav className="flex-1 space-y-1.5 overflow-y-auto -mr-2 pr-2">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
                                activeTab === item.id ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Mobile Dropdown Nav */}
            <div className="md:hidden" ref={mobileNavRef}>
                <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white mb-4">
                    <Database/> Master Data
                </div>
                <div className="relative">
                    <button
                        onClick={() => setIsMobileNavOpen(prev => !prev)}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center"
                        aria-haspopup="listbox"
                        aria-expanded={isMobileNavOpen}
                    >
                        <span>{activeLabel}</span>
                        <ChevronDown size={16} className={`transition-transform text-gray-500 dark:text-gray-400 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMobileNavOpen && (
                        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20 max-h-80 overflow-y-auto animate-fade-in">
                            <ul className="py-1" role="listbox">
                                {navItems.map(item => (
                                    <li key={item.id} role="option" aria-selected={activeTab === item.id}>
                                        <button
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                setIsMobileNavOpen(false);
                                            }}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            {React.cloneElement(item.icon, { className: "text-gray-500 dark:text-gray-400" })}
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-1 md:overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};
