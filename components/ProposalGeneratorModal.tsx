
import React, { useState, useEffect } from 'react';
import { Member, Policy, DocTemplate, UploadedDocument } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { X, FileSignature, Send } from 'lucide-react';

interface ProposalGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  policy: Policy;
  advisorName: string;
  templates: DocTemplate[];
  onSave: (member: Member, closeModal?: boolean) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

// Helper to safely encode UTF-8 strings to base64, preventing errors with Unicode characters.
const utf8_to_b64 = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)));
}

export const ProposalGeneratorModal: React.FC<ProposalGeneratorModalProps> = ({
  isOpen,
  onClose,
  member,
  policy,
  advisorName,
  templates,
  onSave,
  addToast,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    if (isOpen && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    } else {
      setSelectedTemplateId('');
      setGeneratedContent('');
    }
  }, [isOpen, templates]);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        let content = template.content;
        content = content.replace(/{clientName}/g, member.name);
        content = content.replace(/{advisorName}/g, advisorName);
        content = content.replace(/{policyType}/g, policy.policyType);
        content = content.replace(/{sumAssured}/g, policy.coverage.toLocaleString('en-IN'));
        content = content.replace(/{premium}/g, policy.premium.toLocaleString('en-IN'));
        setGeneratedContent(content);
      }
    } else {
      setGeneratedContent('');
    }
  }, [selectedTemplateId, templates, member, policy, advisorName]);

  const handleSendForSignature = () => {
    const newProposalDoc: UploadedDocument = {
        id: `prop-${Date.now()}`,
        documentType: `Proposal: ${policy.policyType}`,
        fileName: `Proposal_${member.name.replace(/\s/g, '_')}_${Date.now()}.txt`,
        fileUrl: `data:text/plain;base64,${utf8_to_b64(generatedContent)}`,
        mimeType: 'text/plain',
        status: 'Sent for Signature',
    };
    
    const updatedMember = {
        ...member,
        documents: [...(member.documents || []), newProposalDoc]
    };
    
    onSave(updatedMember, false); // Don't close the main member modal
    addToast(`Proposal for ${member.name} sent for signature (Simulated).`, 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
            <FileSignature />
            Generate Proposal
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-grow space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Template</label>
            <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="block w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
        </div>
        <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Generated Content</label>
             <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={15}
                className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary focus:outline-none text-gray-800 dark:text-gray-200"
             />
        </div>
      </div>

      <div className="flex-shrink-0 flex justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
        <Button onClick={onClose} variant="secondary">Cancel</Button>
        <Button onClick={handleSendForSignature} variant="primary">
            <Send size={16} /> Send for Signature (Simulated)
        </Button>
      </div>
    </Modal>
  );
};
