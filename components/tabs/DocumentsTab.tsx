import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Member, UploadedDocument, BankDetails, BankMaster, PolicyChecklistMaster, Policy, GeneralInsuranceType } from '../../types.ts';
import Input from '../ui/Input.tsx';
import { extractDataFromImage } from '../../services/geminiService.ts';
import { ImageIcon, Loader2, FileText, Download, FileText as FileTextIcon, Send, CheckCircle, Clock, Banknote, ClipboardList, Check, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button.tsx';

interface DocumentsTabProps {
  data: Partial<Member>;
  allMembers: Member[];
  onChange: (field: keyof Member, value: any) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  errors: Partial<Record<keyof Member | 'bankDetailsError', string>>;
  bankMasters: BankMaster[];
  policyChecklistMasters: PolicyChecklistMaster[];
  onUpdatePolicyChecklistMasters: (data: PolicyChecklistMaster[]) => void;
}

const CustomChecklistItemAdder: React.FC<{
    category: PolicyChecklistMaster;
    onAdd: (name: string, category: PolicyChecklistMaster) => void;
}> = ({ category, onAdd }) => {
    const [newItemName, setNewItemName] = useState('');

    const handleAdd = () => {
        if (newItemName.trim()) {
            onAdd(newItemName.trim(), category);
            setNewItemName('');
        }
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
            <Input 
                placeholder="Add custom item..." 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                className="flex-grow !py-1 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdd();
                    }
                }}
            />
            <Button variant="secondary" size="small" onClick={handleAdd} className="!p-1.5"><Plus size={16}/></Button>
        </div>
    );
};


export const DocumentsTab: React.FC<DocumentsTabProps> = ({ data, allMembers, onChange, addToast, errors, bankMasters, policyChecklistMasters, onUpdatePolicyChecklistMasters }) => {
  const [loadingOcr, setLoadingOcr] = useState<'pan' | 'aadhaar' | null>(null);
  const [addressProofIsImage, setAddressProofIsImage] = useState(true);

  const handleOcrFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, field: 'panCard' | 'aadhaar') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ocrType = field === 'panCard' ? 'pan' : 'aadhaar';
    const documentType = field === 'panCard' ? 'PAN Card' : 'Aadhaar Card';
    setLoadingOcr(ocrType);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const extractedData = await extractDataFromImage(base64String, file.type, addToast);
        
        if (extractedData) {
            if (field === 'panCard' && extractedData.idNumber) onChange('panCard', extractedData.idNumber);
            if (field === 'aadhaar' && extractedData.idNumber) onChange('aadhaar', extractedData.idNumber);
            if (extractedData.name && !data.name) onChange('name', extractedData.name);
            if (extractedData.dob && !data.dob) onChange('dob', extractedData.dob);
            if (extractedData.address && !data.address) onChange('address', extractedData.address);
            if (extractedData.phoneNumber && !data.mobile) onChange('mobile', extractedData.phoneNumber);
            addToast(`Extracted data from ${documentType}`, 'success');
        } else {
             addToast(`Could not extract data from ${documentType}. Please enter manually.`, 'error');
        }
        
        const objectUrl = URL.createObjectURL(file);
        const newDoc: UploadedDocument = {
            id: `doc-${Date.now()}`,
            documentType,
            fileName: file.name,
            fileUrl: objectUrl,
            mimeType: file.type,
            status: 'Uploaded',
        };
        onChange('documents', (prevDocs: UploadedDocument[] | undefined) => [...(prevDocs || []), newDoc]);

      } catch (error) {
        console.error("OCR failed", error);
        addToast(`Failed to extract text from ${field}. Please enter manually.`, 'error');
      } finally {
        setLoadingOcr(null);
      }
    };
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      setLoadingOcr(null);
    };
  }, [onChange, data.name, data.dob, data.address, data.mobile, addToast]);
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, documentType: 'Photo' | 'Proof of Address') => {
    const file = event.target.files?.[0];
    if (file) {
      if (documentType === 'Proof of Address') {
        setAddressProofIsImage(file.type.startsWith('image/'));
      }
      const objectUrl = URL.createObjectURL(file);
      
      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}`,
        documentType,
        fileName: file.name,
        fileUrl: objectUrl,
        mimeType: file.type,
        status: 'Uploaded',
      };

      onChange('documents', (prevDocs: UploadedDocument[] | undefined) => [...(prevDocs || []), newDoc]);
      
      if(documentType === 'Photo') onChange('photoUrl', objectUrl);
      if(documentType === 'Proof of Address') onChange('addressProofUrl', objectUrl);
    }
  }, [onChange]);

    const handleMarkAsSigned = (docId: string) => {
        const updatedDocs = (data.documents || []).map(doc => {
            if (doc.id === docId) {
                return { ...doc, status: 'Signed' as const };
            }
            return doc;
        });
        onChange('documents', updatedDocs);
        addToast('Proposal marked as signed!', 'success');
    };
    
    const getPolicyTypeKey = (policyType: Policy['policyType'], generalType?: GeneralInsuranceType): PolicyChecklistMaster['policyType'] | null => {
        if (policyType === 'Life Insurance') return 'Life Insurance';
        if (policyType === 'Health Insurance') return 'Health Insurance';
        if (policyType === 'General Insurance') return generalType || 'General';
        return null;
    }
      
    const { requiredDocumentTree, customChecklistItems } = useMemo(() => {
        const ownPolicies = data.policies || [];
        const inheritedPolicies: Policy[] = [];

        // Find inherited policies if the member is a dependent
        if (data.spocId && data.memberId) {
            const spoc = allMembers.find(m => m.memberId === data.spocId);
            if (spoc) {
                (spoc.policies || []).forEach(policy => {
                    if (policy.policyHolderType === 'Family') {
                        const isCovered = policy.coveredMembers?.some(cm => 
                            (cm.memberId && cm.memberId === data.memberId) || 
                            (!cm.memberId && cm.name.toLowerCase() === data.name?.toLowerCase() && cm.dob === data.dob)
                        );
                        if (isCovered) {
                            inheritedPolicies.push(policy);
                        }
                    }
                });
            }
        }
    
        const allApplicablePolicies = [...ownPolicies, ...inheritedPolicies];
        const activePolicies = allApplicablePolicies.filter(p => p.status === 'Active');

        if (activePolicies.length === 0) {
            return { requiredDocumentTree: [], customChecklistItems: [] };
        }

        const policyTypesPresent = new Set<PolicyChecklistMaster['policyType']>();
        activePolicies.forEach(p => {
            const key = getPolicyTypeKey(p.policyType, p.generalInsuranceType);
            if (key) {
                policyTypesPresent.add(key);
            }
        });

        const masterItemsNames = new Set(policyChecklistMasters.map(i => i.name));
        const finalTree: { category: PolicyChecklistMaster, items: PolicyChecklistMaster[] }[] = [];
        
        const rootCategories = policyChecklistMasters.filter(item => !item.parentId && item.active);

        rootCategories.forEach(rootCat => {
            if (policyTypesPresent.has(rootCat.policyType)) {
                const items = policyChecklistMasters.filter(item => item.parentId === rootCat.id && item.active);
                if (items.length > 0) {
                     finalTree.push({ category: rootCat, items });
                }
            }
            
            const childrenCategories = policyChecklistMasters.filter(item => item.parentId === rootCat.id && item.active);
            childrenCategories.forEach(childCat => {
                if(policyTypesPresent.has(childCat.policyType)) {
                    const items = policyChecklistMasters.filter(item => item.parentId === childCat.id && item.active);
                    if (items.length > 0) {
                        finalTree.push({ category: childCat, items });
                    }
                }
            });
        });

        finalTree.forEach(node => node.items.sort((a, b) => a.name.localeCompare(b.name)));

        const customItems = Object.entries(data.documentChecklist || {})
            .filter(([key]) => !masterItemsNames.has(key))
            .map(([key, value]) => ({ name: key, value }));

        return { requiredDocumentTree: finalTree, customChecklistItems: customItems };

    }, [data, allMembers, policyChecklistMasters]);


    const handleChecklistChange = (docName: string, value: any) => {
        const newChecklist = { ...(data.documentChecklist || {}), [docName]: value };
        onChange('documentChecklist', newChecklist);
    };

    const handleAddCustomChecklistItem = (itemName: string, category: PolicyChecklistMaster) => {
        const masterNames = new Set(policyChecklistMasters.map(i => i.name.toLowerCase()));
        if (masterNames.has(itemName.toLowerCase()) || (data.documentChecklist && itemName in data.documentChecklist)) {
            addToast('This checklist item already exists.', 'error');
            return;
        }

        const newItem: PolicyChecklistMaster = {
            id: `pcl-custom-${Date.now()}`,
            name: itemName,
            parentId: category.id,
            policyType: category.policyType,
            active: true,
        };

        onUpdatePolicyChecklistMasters([...policyChecklistMasters, newItem]);
        handleChecklistChange(itemName, false);
        addToast(`"${itemName}" added to checklist and master data.`, 'success');
    };

    const handleDeleteCustomChecklistItem = (itemName: string) => {
        const { [itemName]: _, ...rest } = (data.documentChecklist || {});
        onChange('documentChecklist', rest);
    };

    const handleBankDetailsChange = useCallback((field: keyof BankDetails, value: string) => {
        const newBankDetails = {
            ...(data.bankDetails || {}),
            [field]: value,
        };
        onChange('bankDetails', newBankDetails);
    }, [data.bankDetails, onChange]);


  const fileInputClasses = "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700 cursor-pointer dark:text-gray-400";
  
  const orderedDocuments = useMemo(() => {
    const order = ['Aadhaar Card', 'PAN Card', 'Photo', 'Proof of Address'];
    return (data.documents || []).sort((a,b) => {
        const aIndex = order.indexOf(a.documentType);
        const bIndex = order.indexOf(b.documentType);
        if (aIndex === -1 && bIndex === -1) return a.documentType.localeCompare(b.documentType);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });
  }, [data.documents]);

  const StatusBadge = ({ status }: { status: UploadedDocument['status'] }) => {
      if (!status || status === 'Uploaded') return null;
      
      const styles = {
          'Sent for Signature': { icon: <Clock size={12} />, text: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          'Signed': { icon: <CheckCircle size={12} />, text: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30' },
      };
      
      const style = styles[status];
      if (!style) return null;
      
      return (
          <div className={`mt-2 inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
              {style.icon} {status}
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="PAN Card *" id="panCard" value={data.panCard || ''} onChange={(e) => onChange('panCard', e.target.value)} />
        <Input label="Aadhaar *" id="aadhaar" value={data.aadhaar || ''} onChange={(e) => onChange('aadhaar', e.target.value)} />
        
        <div>
          <label htmlFor="panUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan PAN Card (via OCR)</label>
          <div className="flex items-center gap-2">
            <input type="file" id="panUpload" accept="image/*,application/pdf" className={fileInputClasses} onChange={(e) => handleOcrFileChange(e, 'panCard')} disabled={loadingOcr === 'pan'}/>
            {loadingOcr === 'pan' && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
        </div>

        <div>
          <label htmlFor="aadhaarUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan Aadhaar (via OCR)</label>
          <div className="flex items-center gap-2">
            <input type="file" id="aadhaarUpload" accept="image/*,application/pdf" className={fileInputClasses} onChange={(e) => handleOcrFileChange(e, 'aadhaar')} disabled={loadingOcr === 'aadhaar'} />
            {loadingOcr === 'aadhaar' && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                    {data.photoUrl ? (
                        <img src={data.photoUrl} alt="Photo preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
                    ) : (
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label htmlFor="photoUpload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-brand-primary hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary">
                            <span>Upload a file</span>
                            <input id="photoUpload" name="photoUpload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'Photo')} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proof of Address</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                     {data.addressProofUrl ? (
                         addressProofIsImage ? (
                            <img 
                                src={data.addressProofUrl} 
                                alt="Address proof preview" 
                                className="mx-auto h-24 w-auto object-contain rounded-md" 
                                onError={() => setAddressProofIsImage(false)}
                            />
                         ) : (
                            <div className="mx-auto flex flex-col items-center justify-center h-24">
                                <FileText className="h-12 w-12 text-gray-400" />
                                <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">PDF Document</span>
                            </div>
                         )
                    ) : (
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label htmlFor="addressProofUpload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-brand-primary hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary">
                            <span>Upload a file</span>
                            <input id="addressProofUpload" name="addressProofUpload" type="file" className="sr-only" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'Proof of Address')} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF up to 10MB</p>
                </div>
            </div>
        </div>
      </div>
       
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Uploaded Documents</h3>
        {orderedDocuments.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {orderedDocuments.map((doc) => (
                <div key={doc.id} className="relative group bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border dark:border-gray-600/50 text-center flex flex-col justify-between">
                    <div>
                        {doc.mimeType.startsWith('image/') ? <ImageIcon className="w-10 h-10 mx-auto text-gray-400" /> : <FileTextIcon className="w-10 h-10 mx-auto text-gray-400" />}
                        <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{doc.documentType}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={doc.fileName}>{doc.fileName}</p>
                        <StatusBadge status={doc.status} />
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download={doc.fileName} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600">
                            <Download size={16} />
                        </a>
                        {doc.status === 'Sent for Signature' && (
                            <Button size="small" variant="success" onClick={() => handleMarkAsSigned(doc.id)}>
                                <CheckCircle size={14} /> Mark Signed
                            </Button>
                        )}
                    </div>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <FileTextIcon size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
            <p className="mt-2 text-sm font-semibold">No Documents Uploaded</p>
            <p className="mt-1 text-xs">Upload documents using the options above.</p>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardList /> Policy Document Checklist
        </h3>
        {requiredDocumentTree.length > 0 ? (
            <div className="space-y-4">
                {requiredDocumentTree.map(({ category, items }) => (
                    <div key={category.id}>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{category.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {items.map(item => (
                                <label key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <input
                                        type="checkbox"
                                        checked={!!data.documentChecklist?.[item.name]}
                                        onChange={e => handleChecklistChange(item.name, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                    />
                                    <span className="text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                                </label>
                            ))}
                            {customChecklistItems.filter(ci => {
                                const masterItem = policyChecklistMasters.find(pcm => pcm.name === ci.name);
                                return masterItem && masterItem.parentId === category.id;
                            }).map(item => (
                                 <div key={item.name} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={!!item.value}
                                            onChange={e => handleChecklistChange(item.name, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                                    </label>
                                    <Button size="small" variant="danger" className="!p-1" onClick={() => handleDeleteCustomChecklistItem(item.name)}><Trash2 size={12}/></Button>
                                </div>
                            ))}
                            <CustomChecklistItemAdder category={category} onAdd={handleAddCustomChecklistItem} />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Add an active policy in the 'Policies' tab to see the required document checklist.</p>
        )}
      </div>

       <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Banknote /> Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                  <select
                      value={data.bankDetails?.bankName || ''}
                      onChange={e => handleBankDetailsChange('bankName', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                      <option value="">Select a Bank...</option>
                      {bankMasters.filter(b => b.active).map(b => <option key={b.id} value={b.bankName}>{b.bankName}</option>)}
                  </select>
              </div>
              <Input label="Account Number" value={data.bankDetails?.accountNumber || ''} onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)} />
              <Input label="CIF Number" value={data.bankDetails?.cifNumber || ''} onChange={(e) => handleBankDetailsChange('cifNumber', e.target.value)} />
              <Input label="IFSC Code" value={data.bankDetails?.ifscCode || ''} onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)} />
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                  <select
                      value={data.bankDetails?.accountType || ''}
                      onChange={e => handleBankDetailsChange('accountType', e.target.value as any)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                      <option value="">Select Account Type...</option>
                      <option>Current Account</option>
                      <option>Overdraft Account</option>
                      <option>Cash Credit Account</option>
                  </select>
              </div>
          </div>
          {errors.bankDetailsError && <p className="text-red-600 text-xs mt-2">{errors.bankDetailsError}</p>}
      </div>
    </div>
  );
};