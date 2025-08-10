import React, { useState } from 'react';
import { User, AdvisorDocument } from '../../types.ts';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import { Plus, Trash2, FileText, Download, UploadCloud } from 'lucide-react';

interface AdvisorDocumentsTabProps {
    data: Partial<User>;
    onChange: (field: 'profile', value: any) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdvisorDocumentsTab: React.FC<AdvisorDocumentsTabProps> = ({ data, onChange, addToast }) => {
    const [newDocName, setNewDocName] = useState('');
    const [newDocFile, setNewDocFile] = useState<File | null>(null);

    const documents = data.profile?.documents || [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewDocFile(e.target.files[0]);
        }
    };

    const handleAddDocument = () => {
        if (!newDocName.trim()) {
            addToast('Document name is required.', 'error');
            return;
        }
        if (!newDocFile) {
            addToast('Please select a file to upload.', 'error');
            return;
        }

        const newDocument: AdvisorDocument = {
            id: `doc-${Date.now()}`,
            documentName: newDocName.trim(),
            fileName: newDocFile.name,
            fileUrl: URL.createObjectURL(newDocFile),
            mimeType: newDocFile.type,
        };

        onChange('profile', { ...data.profile, documents: [...documents, newDocument] });
        setNewDocName('');
        setNewDocFile(null);
        // Clear the file input visually
        const input = document.getElementById('new-doc-file') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleDeleteDocument = (docId: string) => {
        const docToDelete = documents.find(d => d.id === docId);
        if (docToDelete && docToDelete.fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(docToDelete.fileUrl);
        }
        const updatedDocuments = documents.filter(doc => doc.id !== docId);
        onChange('profile', { ...data.profile, documents: updatedDocuments });
        addToast('Document removed.', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input
                        label="Document Name"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="e.g., 12th Marksheet, PG Certificate"
                    />
                     <div>
                        <label htmlFor="new-doc-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File</label>
                        <div className="relative">
                             <input 
                                id="new-doc-file" 
                                type="file" 
                                onChange={handleFileChange} 
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700 cursor-pointer dark:text-gray-400"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <Button onClick={handleAddDocument} variant="primary">
                        <Plus size={16} /> Add Document
                    </Button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Uploaded Documents</h3>
                {documents.length > 0 ? (
                    <div className="space-y-3">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-brand-primary flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{doc.documentName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{doc.fileName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download={doc.fileName}>
                                        <Button variant="light" size="small"><Download size={14}/> Download</Button>
                                    </a>
                                    <Button variant="danger" size="small" onClick={() => handleDeleteDocument(doc.id)}><Trash2 size={14}/> Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed rounded-lg">
                        <UploadCloud size={32} className="mx-auto text-gray-400 dark:text-gray-500" />
                        <p className="mt-2">No documents have been uploaded for this advisor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
