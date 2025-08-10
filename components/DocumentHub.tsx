import React, { useState } from 'react';
import { DocTemplate } from '../types.ts';
import { FileText, Plus, Save, X, Edit, Trash2 } from 'lucide-react';
import Button from './ui/Button.tsx';

interface DocumentHubProps {
  templates: DocTemplate[];
  onUpdateTemplates: (templates: DocTemplate[]) => void;
}

const DocumentHub: React.FC<DocumentHubProps> = ({ templates, onUpdateTemplates }) => {
  const [editingTemplate, setEditingTemplate] = useState<DocTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleEdit = (template: DocTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setEditingTemplate(() => ({ id: `tpl-${Date.now()}`, name: '', content: '' }));
    setIsCreatingNew(() => true);
  };

  const handleCancel = () => {
    setEditingTemplate(() => null);
    setIsCreatingNew(() => false);
  };

  const handleSave = () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.content) {
      alert('Template name and content cannot be empty.');
      return;
    }
    if (isCreatingNew) {
      onUpdateTemplates([...templates, editingTemplate]);
    } else {
      onUpdateTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    }
    handleCancel();
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      onUpdateTemplates(templates.filter(t => t.id !== templateId));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Document Hub</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your proposal and document templates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Templates</h3>
              <Button onClick={handleCreateNew} size="small" variant="success">
                <Plus size={14} /> New
              </Button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleEdit(template)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    editingTemplate?.id === template.id
                      ? 'bg-blue-50 border-brand-primary dark:bg-blue-900/30'
                      : 'bg-gray-50 border-transparent hover:border-gray-300 dark:bg-gray-700/50 dark:hover:border-gray-600'
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{template.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {editingTemplate ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">{isCreatingNew ? 'Create New Template' : 'Edit Template'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Content</label>
                  <textarea
                    value={editingTemplate.content}
                    onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use placeholders like {'{clientName}'}, {'{policyType}'}, {'{sumAssured}'}, {'{premium}'}, {'{advisorName}'}.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button onClick={handleCancel} variant="secondary"><X size={16} /> Cancel</Button>
                  <Button onClick={handleSave} variant="primary"><Save size={16} /> Save Template</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 dark:bg-gray-800/50 p-10 rounded-lg border-2 border-dashed dark:border-gray-700">
              <FileText size={48} className="text-gray-300 dark:text-gray-600" />
              <p className="mt-4 font-semibold text-gray-600 dark:text-gray-400">Select a template to view or edit</p>
              <p className="text-sm text-gray-500">Or create a new template to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentHub;