import React, { useState } from 'react';
import { Gift, GiftMapping, Member } from '../types.ts';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { Gift as GiftIcon, Plus, Save, Edit, Trash2, X, Edit2 } from 'lucide-react';
import ToggleSwitch from './ui/ToggleSwitch.tsx';

interface GiftManagementProps {
    gifts: Gift[];
    giftMappings: GiftMapping[];
    onUpdateGifts: (gifts: Gift[]) => void;
    onUpdateGiftMappings: (mappings: GiftMapping[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const GiftManagement: React.FC<GiftManagementProps> = ({ gifts, giftMappings, onUpdateGifts, onUpdateGiftMappings, addToast }) => {
    const [newGiftName, setNewGiftName] = useState('');
    const [editingGift, setEditingGift] = useState<Gift | null>(null);
    const [localMappings, setLocalMappings] = useState<GiftMapping[]>(giftMappings);

    const handleAddGift = () => {
        if (!newGiftName.trim()) {
            addToast('Gift name cannot be empty.', 'error');
            return;
        }
        if (gifts.some(g => g.name.toLowerCase() === newGiftName.trim().toLowerCase())) {
            addToast('A gift with this name already exists.', 'error');
            return;
        }
        const newGift: Gift = {
            id: `gift-${Date.now()}`,
            name: newGiftName.trim(),
            active: true,
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
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gift Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage master gifts and assign them to customer tiers.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Master Gift List */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Master Gift List</h3>
                    <div className="space-y-3">
                        {gifts.map(gift => (
                            <div key={gift.id} className={`flex items-center justify-between gap-2 p-2 rounded-md ${gift.active === false ? 'bg-gray-200 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                {editingGift?.id === gift.id ? (
                                    <Input value={editingGift.name} onChange={e => setEditingGift({...editingGift, name: e.target.value})} />
                                ) : (
                                    <p className={`text-sm font-medium ${gift.active === false ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>{gift.name}</p>
                                )}
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <ToggleSwitch enabled={gift.active !== false} onChange={() => handleToggleGift(gift.id)} />
                                    {editingGift?.id === gift.id ? (
                                        <>
                                            <Button size="small" variant="light" className="!p-2" onClick={() => setEditingGift(null)}><X size={14}/></Button>
                                            <Button size="small" variant="success" className="!p-2" onClick={handleUpdateGift}><Save size={14}/></Button>
                                        </>
                                    ) : (
                                        <Button size="small" variant="light" className="!p-2" onClick={() => setEditingGift(gift)}><Edit2 size={14}/></Button>
                                    )}
                                </div>
                            </div>
                        ))}
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

export default GiftManagement;