import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Member, VoiceNote, Policy, User, SpecialOccasion, Task } from '../../types.ts';
import { summarizeTranscript, transcribeAudioToEnglish } from '../../services/geminiService.ts';
import Button from '../ui/Button.tsx';
import { Mic, StopCircle, Loader2, Tag, Languages, Calendar, FileText, XCircle, RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
import Input from '../ui/Input.tsx';

interface NotesAndRemindersTabProps {
  data: Partial<Member>;
  onSave: (member: Member) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
  onChange: (field: keyof Member, value: any) => void;
  currentUser: User | null;
}

type Status = 'idle' | 'recording' | 'transcribing' | 'summarizing' | 'error';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const ToggleSwitch = ({ label, enabled, onChange }: {label: string, enabled: boolean, onChange: () => void}) => (
    <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">{label}</span>
        <button
            type="button"
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${
                enabled ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-600'
            }`}
            onClick={onChange}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
);


export const NotesAndRemindersTab: React.FC<NotesAndRemindersTabProps> = ({ data, onSave, addToast, onCreateTask, onChange, currentUser }) => {
  const [status, setStatus] = React.useState<Status>('idle');
  const [audioURL, setAudioURL] = React.useState('');
  const [englishTranscript, setEnglishTranscript] = React.useState('');
  const [liveTranscript, setLiveTranscript] = React.useState('');
  
  const [newOccasionName, setNewOccasionName] = useState('');
  const [newOccasionDate, setNewOccasionDate] = useState('');

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recognitionRef = React.useRef<any | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  
  const canCreateNote = useMemo(() => {
    if (!data || !currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    return currentUser.role === 'Advisor' && data.assignedTo?.includes(currentUser.id);
  }, [data, currentUser]);


  React.useEffect(() => {
    return () => {
      if (audioURL) URL.revokeObjectURL(audioURL);
      mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
      recognitionRef.current?.stop();
    };
  }, [data.id, audioURL]);

  const resetState = React.useCallback(() => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL('');
    setEnglishTranscript('');
    setLiveTranscript('');
    setStatus('idle');
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, [audioURL]);


  const startRecording = React.useCallback(async () => {
    resetState();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) interim += event.results[i][0].transcript;
            setLiveTranscript(interim);
        };
        recognitionRef.current.start();
      }

      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
        recognitionRef.current?.stop();
        setStatus('transcribing');
        addToast('Recording stopped. Finalizing transcript...', 'success');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const transcript = await transcribeAudioToEnglish(base64Audio, options.mimeType, addToast);
                if (!transcript || transcript.toLowerCase().includes('error')) throw new Error(transcript || "Transcription failed.");
                setEnglishTranscript(transcript);
                setStatus('summarizing');
                const previousSummaries = data.voiceNotes?.map(n => n.summary) || [];
                const summaryResult = await summarizeTranscript(transcript, data.name || 'N/A', previousSummaries, addToast);
                if (summaryResult) {
                    const newNote: VoiceNote = { ...summaryResult, id: `note-${Date.now()}`, filename: `${data.name?.replace(/\s/g, '')}Rec.webm`, audioUrl: url, createdBy: currentUser?.id };
                    onSave({ ...data, voiceNotes: [...(data.voiceNotes || []), newNote] } as Member);
                    addToast('Voice note transcribed and saved!', 'success');
                    resetState();
                } else throw new Error("Summarization failed.");
            };
        } catch(error) {
            addToast(`Error: ${(error as Error).message}`, 'error');
            setStatus('error');
        }
      };
      mediaRecorderRef.current.start();
      setStatus('recording');
      addToast('Recording started...', 'success');
    } catch (err) {
      addToast("Microphone access denied.", "error");
      setStatus('error');
    }
  }, [resetState, data, addToast, onSave, currentUser]);

  const stopRecording = React.useCallback(() => {
    if (status === 'recording' && mediaRecorderRef.current) mediaRecorderRef.current.stop();
  }, [status]);
  
  const handleDismissActionItem = (noteId: string, actionItemText: string) => {
    const updatedNotes = (data.voiceNotes || []).map(note => {
        if (note.id === noteId) {
            return { ...note, actionItems: (note.actionItems || []).filter(item => item !== actionItemText) };
        }
        return note;
    });
    onSave({ ...data, voiceNotes: updatedNotes } as Member);
    addToast('Action item dismissed.', 'success');
  };
  
  const handleCreateTaskFromActionItem = (noteId: string, actionItemText: string) => {
      onCreateTask({
          triggeringPoint: 'Voice Note Action Item',
          taskDescription: actionItemText,
          expectedCompletionDateTime: new Date().toISOString(),
          memberId: data.id,
          taskType: 'Manual',
          isCompleted: false,
      });
      handleDismissActionItem(noteId, actionItemText);
  };

  const handleAddOccasion = () => {
    if (!newOccasionName.trim() || !newOccasionDate) {
        addToast('Please provide both a name and a date for the occasion.', 'error');
        return;
    }
    const newOccasion: SpecialOccasion = {
        id: `occ-${Date.now()}`,
        name: newOccasionName.trim(),
        date: newOccasionDate,
    };
    onChange('otherSpecialOccasions', [...(data.otherSpecialOccasions || []), newOccasion]);
    setNewOccasionName('');
    setNewOccasionDate('');
  };

  const handleDeleteOccasion = (id: string) => {
    onChange('otherSpecialOccasions', (data.otherSpecialOccasions || []).filter(occ => occ.id !== id));
  };

  const TagBadge = ({ text }: { text: string }) => (
    <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
      <Tag size={12}/> {text}
    </span>
  );
  
  const getStatusIndicator = () => {
      switch(status) {
          case 'recording': return <div className="text-red-500 font-semibold animate-pulse flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Recording...</div>;
          case 'transcribing': return <div className="text-blue-500 font-semibold flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Finalizing Transcript...</div>;
          case 'summarizing': return <div className="text-purple-500 font-semibold flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Summarizing with AI...</div>
          case 'error': return (<div className="text-red-500 font-semibold flex items-center gap-2"><XCircle size={16}/> An error occurred.</div>);
          default: return <span className="text-sm text-gray-500 dark:text-gray-400">Ready to record.</span>;
      }
  }

  return (
    <div className="space-y-8">
      {/* Voice Notes Section */}
      <div className="space-y-4">
        {canCreateNote && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Voice Note</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                <Button onClick={status === 'recording' ? stopRecording : startRecording} variant={status === 'recording' ? 'danger' : 'primary'} disabled={status === 'transcribing' || status === 'summarizing'}>
                    {status === 'recording' ? <StopCircle size={16} /> : <Mic size={16} />}
                    {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
                </Button>
                {status === 'error' && (<Button onClick={resetState} variant="secondary"><RefreshCw size={16} /> Try Again</Button>)}
                {getStatusIndicator()}
                </div>
                
                {status === 'recording' && (<div className="animate-fade-in p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 min-h-[8rem]"><h4 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-2">Live Preview</h4><p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{liveTranscript || <span className="text-gray-400">Listening...</span>}</p></div>)}
                {(englishTranscript || status === 'transcribing' || status === 'summarizing') && status !== 'recording' && (<div className="animate-fade-in p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 min-h-[8rem]"><h4 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-2">Final English Transcript</h4>{status === 'transcribing' || status === 'summarizing' ? (<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><Loader2 className="animate-spin" size={14}/> Gemini is processing the audio...</div>): (<p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{englishTranscript}</p>)}</div>)}
                {audioURL && (<div className="animate-fade-in"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recorded Audio</label><audio src={audioURL} controls className="w-full" /></div>)}
            </div>
            </div>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Saved Notes</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {(!data.voiceNotes || data.voiceNotes.length === 0) ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400"><FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600"/><p className="mt-2 text-sm font-semibold">No Voice Notes</p><p className="mt-1 text-xs">Record a new note to get started.</p></div>
            ) : 
              data.voiceNotes.slice().reverse().map((note) => (
                <div key={note.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in">
                  <div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400"><div className="flex items-center gap-1"><Calendar size={14} /><span>{new Date(note.recording_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div><div className="flex items-center gap-1"><Languages size={14} /><span>Language: {note.detected_language}</span></div></div>
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.summary}</p>
                  {note.audioUrl && (<div className="mt-3"><audio src={note.audioUrl} controls className="w-full h-10" /></div>)}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap gap-2">{note.tags.map((tag, i) => <TagBadge key={i} text={tag} />)}</div>
                  {note.actionItems && note.actionItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                        <h4 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-2">Detected Action Items</h4>
                        <ul className="space-y-2">{note.actionItems.map((item, index) => (<li key={index} className="flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md"><span>- {item}</span><div className="flex items-center gap-1"><Button size="small" variant="light" onClick={() => handleCreateTaskFromActionItem(note.id, item)}><PlusCircle size={14} /> Create Task</Button><Button size="small" variant="danger" className="!p-2" onClick={() => handleDismissActionItem(note.id, item)}><Trash2 size={14} /></Button></div></li>))}</ul>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
      
      {/* Special Dates Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Special Dates & Greetings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-end"><ToggleSwitch label="Automated Greetings" enabled={!!data.automatedGreetingsEnabled} onChange={() => onChange('automatedGreetingsEnabled', !data.automatedGreetingsEnabled)}/></div>

          <div className="md:col-span-2 mt-4">
             <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Other Special Occasions</h4>
             <div className="space-y-2">
                {(data.otherSpecialOccasions || []).map(occ => (
                    <div key={occ.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{occ.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(occ.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <Button variant="danger" size="small" className="!p-2" onClick={() => handleDeleteOccasion(occ.id)}><Trash2 size={14}/></Button>
                    </div>
                ))}
             </div>
             <div className="flex items-end gap-2 mt-3 pt-3 border-t dark:border-gray-600">
                <Input placeholder="Occasion Name" value={newOccasionName} onChange={(e) => setNewOccasionName(e.target.value)} />
                <Input type="date" value={newOccasionDate} onChange={(e) => setNewOccasionDate(e.target.value)} />
                <Button variant="secondary" onClick={handleAddOccasion} className="flex-shrink-0"><PlusCircle size={16}/> Add</Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
