
import React from 'react';
import { Member, VoiceNote } from '../types.ts';
import Button from './ui/Button.tsx';
import { Tag, Calendar, PlusCircle, FileText } from 'lucide-react';

interface VoiceNotesTabProps {
  data: Partial<Member>;
  onSave: (member: Member) => void; // Kept for potential future use like deleting a note
  addToast: (message: string, type?: 'success' | 'error') => void;
  onCreateTask: (description: string, dueDate?: string, memberName?: string) => void;
}


export const VoiceNotesTab: React.FC<VoiceNotesTabProps> = ({ data, onSave, addToast, onCreateTask }) => {

  const handleCreateTaskFromActionItem = (noteId: string, actionItemText: string) => {
    // 1. Create the task using the existing global function
    onCreateTask(actionItemText, undefined, data.name || 'N/A');
    
    // 2. Remove the action item from the specific voice note
    const updatedNotes = (data.voiceNotes || []).map(note => {
      if (note.id === noteId) {
        const newActionItems = (note.actionItems || []).filter(item => item !== actionItemText);
        return { ...note, actionItems: newActionItems };
      }
      return note;
    });

    // 3. Save the updated member data via the onSave prop to persist the change
    const updatedMemberData = { ...data, voiceNotes: updatedNotes };
    onSave(updatedMemberData as Member);
    addToast('Task created from action item!', 'success');
  };
  
  const TagBadge = ({ text }) => (
    <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
      <Tag size={12}/> {text}
    </span>
  );

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Saved Notes</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {(!data.voiceNotes || data.voiceNotes.length === 0) ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
                <p className="mt-2 text-sm font-semibold">No Voice Notes</p>
                <p className="mt-1 text-xs">Record a new note from the main 'Notes' page.</p>
            </div>
          ) : (
            data.voiceNotes.slice().reverse().map((note) => (
              <div key={note.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in">
                <div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(note.recording_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
                
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.summary}</p>
                
                {note.audioUrl && (
                    <div className="mt-3">
                        <audio src={note.audioUrl} controls className="w-full h-10" />
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap gap-2">
                    {note.tags.map((tag, i) => <TagBadge key={i} text={tag} />)}
                </div>

                {note.actionItems && note.actionItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                    <h4 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-2">Detected Action Items</h4>
                    <ul className="space-y-2">
                      {note.actionItems.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                          <span>- {item}</span>
                          <Button size="small" variant="light" onClick={() => handleCreateTaskFromActionItem(note.id, item)}>
                            <PlusCircle size={14} /> Create Task
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
    </div>
  );
};
