import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Member, Policy, PolicyType, GeneralInsuranceType, LICData, LICFamilyMember, LICPreviousPolicy, CoveredMember, Traveler, User, SchemeMaster, Company, InsuranceTypeMaster, InsuranceFieldMaster, HealthInsuranceData } from '../../types.ts';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { getPolicySuggestions, analyzePaymentProof } from '../../services/geminiService.ts';
import { calculatePremium } from '../../services/apiService.ts';
import { X, Loader2, UploadCloud, CheckCircle, AlertTriangle, XCircle, Trash2, Eye, Check, PlusCircle, User as UserIcon, Users, FileSignature, Lightbulb, Percent, Plus, ArrowLeft, Save, Edit2, Info, ChevronDown } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch.tsx';
import { bloodGroups } from '../../constants.tsx';

const getPremiumForFrequency = (annualPremium: number, frequency: Policy['premiumFrequency']) => {
    if (!annualPremium) return 0;
    switch (frequency) {
        case 'Monthly': return Math.round(annualPremium / 12);
        case 'Quarterly': return Math.round(annualPremium / 4);
        case 'Half-Yearly': return Math.round(annualPremium / 2);
        case 'Yearly':
        default:
            return annualPremium;
    }
};

// --- NEW Reusable FormSection Component ---
// This component provides visual grouping for form sections without being collapsible,
// addressing the user's request to remove "drops" (accordions).
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    return (
        <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
            <div className="w-full p-4 text-left font-semibold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                {title}
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};

// --- Reusable Form Components ---
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-md font-semibold text-brand-dark dark:text-white border-b-2 border-brand-primary pb-2 mb-4 col-span-full">{title}</h3>
);

// --- NEW Editable Table Component for Custom Fields ---
const EditableTable: React.FC<{
    name: string;
    tableData: { headers: string[]; rows: string[][] };
    onDataChange: (fieldName: string, value: any) => void;
    onRemoveField: (fieldName: string) => void;
    isReadOnly: boolean;
}> = ({ name, tableData, onDataChange, onRemoveField, isReadOnly }) => {
    
    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = tableData.rows.map((row, rIndex) => 
            rIndex === rowIndex 
                ? row.map((cell, cIndex) => cIndex === colIndex ? value : cell) 
                : row
        );
        onDataChange(name, { ...tableData, __type: 'table', rows: newRows });
    };
    
    const handleHeaderChange = (colIndex: number, value: string) => {
        const newHeaders = tableData.headers.map((header, hIndex) => hIndex === colIndex ? value : header);
        onDataChange(name, { ...tableData, __type: 'table', headers: newHeaders });
    };

    const handleAddRow = () => {
        const newRow = Array(tableData.headers.length).fill('');
        onDataChange(name, { ...tableData, __type: 'table', rows: [...tableData.rows, newRow] });
    };
    
    const handleRemoveRow = (rowIndex: number) => {
        if (tableData.rows.length <= 1) return; // Don't remove the last row
        const newRows = tableData.rows.filter((_, index) => index !== rowIndex);
        onDataChange(name, { ...tableData, __type: 'table', rows: newRows });
    };

    return (
        <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-white">{name}</h4>
                <Button variant="danger" size="small" className="!p-1.5" onClick={() => onRemoveField(name)} disabled={isReadOnly}>
                    <Trash2 size={14} />
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b dark:border-gray-600">
                            {tableData.headers.map((header, colIndex) => (
                                <th key={colIndex} className="p-1">
                                    <Input 
                                        value={header} 
                                        onChange={e => handleHeaderChange(colIndex, e.target.value)} 
                                        className="font-bold bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none"
                                        disabled={isReadOnly}
                                    />
                                </th>
                            ))}
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b dark:border-gray-600/50 last:border-b-0">
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="p-1">
                                        <Input 
                                            value={cell} 
                                            onChange={e => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="bg-white dark:bg-gray-800"
                                            disabled={isReadOnly}
                                        />
                                    </td>
                                ))}
                                <td>
                                    <Button variant="danger" size="small" className="!p-1.5 ml-1" onClick={() => handleRemoveRow(rowIndex)} disabled={tableData.rows.length <= 1 || isReadOnly}>
                                        <Trash2 size={12} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Button onClick={handleAddRow} size="small" variant="light" className="mt-3" disabled={isReadOnly}>
                <Plus size={14} /> Add Row
            </Button>
        </div>
    );
};


// --- General Insurance Mock Forms ---
const MotorInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <Input label="Vehicle Registration No." value={data.vehicleRegNo || ''} onChange={e => onChange('vehicleRegNo', e.target.value)} disabled={isReadOnly} />
        <Input label="Make" value={data.make || ''} onChange={e => onChange('make', e.target.value)} disabled={isReadOnly} />
        <Input label="Model" value={data.model || ''} onChange={e => onChange('model', e.target.value)} disabled={isReadOnly} />
        <Input label="Variant" value={data.variant || ''} onChange={e => onChange('variant', e.target.value)} disabled={isReadOnly} />
        <Input label="Manufacturing Year" type="number" value={data.manufacturingYear || ''} onChange={e => onChange('manufacturingYear', parseInt(e.target.value) || undefined)} disabled={isReadOnly} />
        <Input label="Fuel Type" value={data.fuelType || ''} onChange={e => onChange('fuelType', e.target.value)} disabled={isReadOnly} />
        <Input label="Engine No." value={data.engineNo || ''} onChange={e => onChange('engineNo', e.target.value)} disabled={isReadOnly} />
        <Input label="Chassis No." value={data.chassisNo || ''} onChange={e => onChange('chassisNo', e.target.value)} disabled={isReadOnly} />
        <Input label="Previous Policy Details" value={data.previousPolicyDetails || ''} onChange={e => onChange('previousPolicyDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Owner's Name" value={data.ownerName || ''} onChange={e => onChange('ownerName', e.target.value)} disabled={isReadOnly} />
        <Input label="Contact Info" value={data.contactInfo || ''} onChange={e => onChange('contactInfo', e.target.value)} disabled={isReadOnly} />
        <Input label="Registration State/City" value={data.registrationStateCity || ''} onChange={e => onChange('registrationStateCity', e.target.value)} disabled={isReadOnly} />
        <Input label="Usage Type" value={data.usageType || ''} onChange={e => onChange('usageType', e.target.value)} disabled={isReadOnly} />
        <Input label="No Claim Bonus (NCB)" value={data.ncb || ''} onChange={e => onChange('ncb', e.target.value)} disabled={isReadOnly} />
        <Input label="IDV (₹)" type="number" value={data.idv || ''} onChange={e => onChange('idv', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
    </div>
);
const HomeInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Owner's Name" value={data.ownerName || ''} onChange={e => onChange('ownerName', e.target.value)} disabled={isReadOnly} />
        <div className="md:col-span-2"><Input label="Property Address" value={data.propertyAddress || ''} onChange={e => onChange('propertyAddress', e.target.value)} disabled={isReadOnly} /></div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
            <select value={data.propertyType || ''} onChange={e => onChange('propertyType', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isReadOnly}>
                <option value="" disabled>Select type...</option><option>Apartment</option><option>Independent</option>
            </select>
        </div>
        <Input label="Year of Construction" type="number" value={data.yearOfConstruction || ''} onChange={e => onChange('yearOfConstruction', parseInt(e.target.value) || undefined)} disabled={isReadOnly} />
        <Input label="Sum Insured for Structure (₹)" type="number" value={data.sumInsuredForStructure || ''} onChange={e => onChange('sumInsuredForStructure', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Sum Insured for Contents (₹)" type="number" value={data.sumInsuredForContents || ''} onChange={e => onChange('sumInsuredForContents', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Security Features" value={data.securityFeatures || ''} onChange={e => onChange('securityFeatures', e.target.value)} disabled={isReadOnly} />
        <Input label="Occupancy Type" value={data.occupancyType || ''} onChange={e => onChange('occupancyType', e.target.value)} disabled={isReadOnly} />
        <Input label="Policy Tenure" value={data.policyTenure || ''} onChange={e => onChange('policyTenure', e.target.value)} disabled={isReadOnly} />
    </div>
);
const TravelersManager: React.FC<{ travelers: Traveler[], onTravelersChange: (newTravelers: Traveler[]) => void, isReadOnly: boolean }> = ({ travelers, onTravelersChange, isReadOnly }) => {
    const handleAdd = () => onTravelersChange([...travelers, { id: `trav-${Date.now()}`, name: '', age: 0, relationship: 'Self' }]);
    const handleRemove = (index: number) => onTravelersChange(travelers.filter((_, i) => i !== index));
    const handleChange = (index: number, field: keyof Traveler, value: any) => {
        const newTravelers = [...travelers];
        newTravelers[index] = { ...newTravelers[index], [field]: value };
        onTravelersChange(newTravelers);
    };
    const selectClasses = 'w-full px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary';
    return (
        <div className="space-y-2">
            <div className="overflow-x-auto"><table className="min-w-full text-sm">
                <thead><tr><th className="text-left p-1">Name</th><th className="text-left p-1">Age</th><th className="text-left p-1">Relationship</th><th></th></tr></thead>
                <tbody>{travelers.map((t, i) => (
                    <tr key={t.id} className="border-b dark:border-gray-700">
                        <td><Input value={t.name} onChange={e => handleChange(i, 'name', e.target.value)} disabled={isReadOnly} /></td>
                        <td><Input type="number" value={t.age || ''} onChange={e => handleChange(i, 'age', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td><select value={t.relationship} onChange={e => handleChange(i, 'relationship', e.target.value as Traveler['relationship'])} className={selectClasses} disabled={isReadOnly}><option>Self</option><option>Spouse</option><option>Child</option><option>Parent</option><option>Other</option></select></td>
                        <td><Button variant="danger" size="small" onClick={() => handleRemove(i)} className="!p-2" disabled={isReadOnly}><Trash2 size={16}/></Button></td>
                    </tr>
                ))}</tbody>
            </table></div>
            <Button variant="secondary" size="small" onClick={handleAdd} disabled={isReadOnly}><PlusCircle size={14}/> Add Traveler</Button>
        </div>
    );
}

const TravelInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, onTravelersChange: (travelers: Traveler[]) => void, isReadOnly: boolean }> = ({ data, onChange, onTravelersChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Traveler's Full Name" value={data.travelerName || ''} onChange={e => onChange('travelerName', e.target.value)} disabled={isReadOnly} />
        <Input label="Date of Birth / Age" value={data.dobOrAge || ''} onChange={e => onChange('dobOrAge', e.target.value)} disabled={isReadOnly} />
        <Input label="Passport Number" value={data.passportNumber || ''} onChange={e => onChange('passportNumber', e.target.value)} disabled={isReadOnly} />
        <Input label="Trip Start Date" type="date" value={data.tripStartDate || ''} onChange={e => onChange('tripStartDate', e.target.value)} disabled={isReadOnly} />
        <Input label="Trip End Date" type="date" value={data.tripEndDate || ''} onChange={e => onChange('tripEndDate', e.target.value)} disabled={isReadOnly} />
        <Input label="Destination Country/Countries" value={data.destination || ''} onChange={e => onChange('destination', e.target.value)} disabled={isReadOnly} />
        <Input label="Purpose of Travel" value={data.purposeOfTravel || ''} onChange={e => onChange('purposeOfTravel', e.target.value)} disabled={isReadOnly} />
        <Input label="Sum Insured" type="number" value={data.sumInsured || ''} onChange={e => onChange('sumInsured', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Pre-existing Medical Conditions" value={data.preExistingMedicalConditions || ''} onChange={e => onChange('preExistingMedicalConditions', e.target.value)} disabled={isReadOnly} />
        <Input label="Nominee Details" value={data.nomineeDetails || ''} onChange={e => onChange('nomineeDetails', e.target.value)} disabled={isReadOnly} />
        <div className="md:col-span-2"><h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Travelers</h4><TravelersManager travelers={data.travelers || []} onTravelersChange={onTravelersChange} isReadOnly={isReadOnly} /></div>
    </div>
);

const CommercialInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Business Name" value={data.businessName || ''} onChange={e => onChange('businessName', e.target.value)} disabled={isReadOnly} />
        <Input label="Business Type" value={data.businessType || ''} onChange={e => onChange('businessType', e.target.value)} disabled={isReadOnly} />
        <div className="md:col-span-2"><Input label="Location Address" value={data.locationAddress || ''} onChange={e => onChange('locationAddress', e.target.value)} disabled={isReadOnly} /></div>
        <Input label="Property Value" type="number" value={data.propertyValue || ''} onChange={e => onChange('propertyValue', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Inventory/Stock Value" type="number" value={data.inventoryValue || ''} onChange={e => onChange('inventoryValue', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Equipment/Machinery Details" value={data.equipmentDetails || ''} onChange={e => onChange('equipmentDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Annual Turnover" type="number" value={data.annualTurnover || ''} onChange={e => onChange('annualTurnover', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Number of Employees" type="number" value={data.numEmployees || ''} onChange={e => onChange('numEmployees', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Coverage Type" value={data.coverageType || ''} onChange={e => onChange('coverageType', e.target.value)} disabled={isReadOnly} />
    </div>
);

const FireInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Policyholder Name" value={data.policyholderName || ''} onChange={e => onChange('policyholderName', e.target.value)} disabled={isReadOnly} />
        <div className="md:col-span-2"><Input label="Property Address" value={data.propertyAddress || ''} onChange={e => onChange('propertyAddress', e.target.value)} disabled={isReadOnly} /></div>
        <Input label="Type of Building/Property" value={data.propertyType || ''} onChange={e => onChange('propertyType', e.target.value)} disabled={isReadOnly} />
        <Input label="Nature of Occupancy" value={data.occupancyNature || ''} onChange={e => onChange('occupancyNature', e.target.value)} disabled={isReadOnly} />
        <Input label="Sum Insured (Structure & Contents)" type="number" value={data.sumInsured || ''} onChange={e => onChange('sumInsured', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Construction Material Used" value={data.constructionMaterial || ''} onChange={e => onChange('constructionMaterial', e.target.value)} disabled={isReadOnly} />
        <Input label="Fire Protection Measures" value={data.fireProtectionMeasures || ''} onChange={e => onChange('fireProtectionMeasures', e.target.value)} disabled={isReadOnly} />
        <Input label="Policy Duration" value={data.policyDuration || ''} onChange={e => onChange('policyDuration', e.target.value)} disabled={isReadOnly} />
    </div>
);

const MarineInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Shipper/Insured Name" value={data.shipperName || ''} onChange={e => onChange('shipperName', e.target.value)} disabled={isReadOnly} />
        <Input label="Type of Cargo" value={data.cargoType || ''} onChange={e => onChange('cargoType', e.target.value)} disabled={isReadOnly} />
        <Input label="Mode of Transport" value={data.transportMode || ''} onChange={e => onChange('transportMode', e.target.value)} disabled={isReadOnly} />
        <Input label="Port of Loading & Discharge" value={data.ports || ''} onChange={e => onChange('ports', e.target.value)} disabled={isReadOnly} />
        <Input label="Invoice Value" type="number" value={data.invoiceValue || ''} onChange={e => onChange('invoiceValue', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Description of Goods" value={data.goodsDescription || ''} onChange={e => onChange('goodsDescription', e.target.value)} disabled={isReadOnly} />
        <Input label="Transit Period" value={data.transitPeriod || ''} onChange={e => onChange('transitPeriod', e.target.value)} disabled={isReadOnly} />
        <Input label="Packaging Details" value={data.packagingDetails || ''} onChange={e => onChange('packagingDetails', e.target.value)} disabled={isReadOnly} />
    </div>
);

const PersonalAccidentInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Full Name" value={data.fullName || ''} onChange={e => onChange('fullName', e.target.value)} disabled={isReadOnly} />
        <Input label="Date of Birth / Age" value={data.dobOrAge || ''} onChange={e => onChange('dobOrAge', e.target.value)} disabled={isReadOnly} />
        <Input label="Occupation" value={data.occupation || ''} onChange={e => onChange('occupation', e.target.value)} disabled={isReadOnly} />
        <Input label="Nominee Details" value={data.nomineeDetails || ''} onChange={e => onChange('nomineeDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Sum Insured" type="number" value={data.sumInsured || ''} onChange={e => onChange('sumInsured', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Risk Category" value={data.riskCategory || ''} onChange={e => onChange('riskCategory', e.target.value)} disabled={isReadOnly} />
        <Input label="Medical History (if required)" value={data.medicalHistory || ''} onChange={e => onChange('medicalHistory', e.target.value)} disabled={isReadOnly} />
    </div>
);

const CropInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Farmer Name & ID" value={data.farmerId || ''} onChange={e => onChange('farmerId', e.target.value)} disabled={isReadOnly} />
        <Input label="Land Details (Survey No., Area)" value={data.landDetails || ''} onChange={e => onChange('landDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Crop Type" value={data.cropType || ''} onChange={e => onChange('cropType', e.target.value)} disabled={isReadOnly} />
        <Input label="Sowing and Harvesting Dates" value={data.sowingHarvestingDates || ''} onChange={e => onChange('sowingHarvestingDates', e.target.value)} disabled={isReadOnly} />
        <Input label="Location (Village, Taluk, District)" value={data.location || ''} onChange={e => onChange('location', e.target.value)} disabled={isReadOnly} />
        <Input label="Loan Details (if linked)" value={data.loanDetails || ''} onChange={e => onChange('loanDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Bank Account Details" value={data.bankAccountDetails || ''} onChange={e => onChange('bankAccountDetails', e.target.value)} disabled={isReadOnly} />
    </div>
);

const LiabilityInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Insured Entity Name" value={data.insuredEntityName || ''} onChange={e => onChange('insuredEntityName', e.target.value)} disabled={isReadOnly} />
        <Input label="Business Type" value={data.businessType || ''} onChange={e => onChange('businessType', e.target.value)} disabled={isReadOnly} />
        <Input label="Annual Revenue" type="number" value={data.annualRevenue || ''} onChange={e => onChange('annualRevenue', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Nature of Risk" value={data.riskNature || ''} onChange={e => onChange('riskNature', e.target.value)} disabled={isReadOnly} />
        <Input label="Coverage Type" value={data.coverageType || ''} onChange={e => onChange('coverageType', e.target.value)} disabled={isReadOnly} />
        <Input label="Number of Employees" type="number" value={data.numEmployees || ''} onChange={e => onChange('numEmployees', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Prior Claims History" value={data.claimsHistory || ''} onChange={e => onChange('claimsHistory', e.target.value)} disabled={isReadOnly} />
        <Input label="Desired Sum Insured" type="number" value={data.desiredSumInsured || ''} onChange={e => onChange('desiredSumInsured', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
    </div>
);

const ShopkeeperInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Shop Name & Owner Name" value={data.shopOwnerName || ''} onChange={e => onChange('shopOwnerName', e.target.value)} disabled={isReadOnly} />
        <div className="md:col-span-2"><Input label="Shop Address" value={data.shopAddress || ''} onChange={e => onChange('shopAddress', e.target.value)} disabled={isReadOnly} /></div>
        <Input label="Type of Goods/Services Sold" value={data.goodsType || ''} onChange={e => onChange('goodsType', e.target.value)} disabled={isReadOnly} />
        <Input label="Inventory Value" type="number" value={data.inventoryValue || ''} onChange={e => onChange('inventoryValue', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Building Value" type="number" value={data.buildingValue || ''} onChange={e => onChange('buildingValue', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Number of Employees" type="number" value={data.numEmployees || ''} onChange={e => onChange('numEmployees', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
        <Input label="Policy Term" value={data.policyTerm || ''} onChange={e => onChange('policyTerm', e.target.value)} disabled={isReadOnly} />
        <Input label="Safety Features" value={data.safetyFeatures || ''} onChange={e => onChange('safetyFeatures', e.target.value)} disabled={isReadOnly} />
    </div>
);

const MiscellaneousInsuranceForm: React.FC<{ data: any, onChange: (field: string, value: any) => void, isReadOnly: boolean }> = ({ data, onChange, isReadOnly }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input label="Gadget: IMEI, Model, Purchase Date" value={data.gadgetDetails || ''} onChange={e => onChange('gadgetDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Pet: Name, Breed, Medical History" value={data.petDetails || ''} onChange={e => onChange('petDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Cyber: Use Case, System Details" value={data.cyberDetails || ''} onChange={e => onChange('cyberDetails', e.target.value)} disabled={isReadOnly} />
        <Input label="Event: Name, Venue, Dates, Cost" value={data.eventDetails || ''} onChange={e => onChange('eventDetails', e.target.value)} disabled={isReadOnly} />
    </div>
);


const GeneralInsuranceSheet: React.FC<{ policy: Policy, onDataChange: (field: string, value: any) => void, onTravelersChange: (travelers: Traveler[]) => void, isReadOnly: boolean }> = ({ policy, onDataChange, onTravelersChange, isReadOnly }) => {
    const renderForm = () => {
        switch(policy.generalInsuranceType) {
            case 'Motor': return <MotorInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Home': return <HomeInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Travel': return <TravelInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} onTravelersChange={onTravelersChange} isReadOnly={isReadOnly} />;
            case 'Commercial': return <CommercialInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Fire': return <FireInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Marine': return <MarineInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Personal Accident': return <PersonalAccidentInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Crop': return <CropInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Liability': return <LiabilityInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Shopkeeper': return <ShopkeeperInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            case 'Miscellaneous': return <MiscellaneousInsuranceForm data={policy.generalInsuranceData || {}} onChange={onDataChange} isReadOnly={isReadOnly} />;
            default: return null;
        }
    };
    return (
        <div className="animate-fade-in">
            {policy.generalInsuranceType && <div className="p-4 bg-white dark:bg-gray-800 rounded-md border dark:border-gray-600">{renderForm()}</div>}
        </div>
    );
};

const LICForm: React.FC<{ data: Partial<Member>; licData: LICData; onLicChange: (field: keyof LICData, value: any) => void; policyHolderType?: 'Individual' | 'Family'; isReadOnly: boolean; }> = ({ data, licData, onLicChange, policyHolderType, isReadOnly }) => {
    const handleAddPrevPolicy = () => onLicChange('previousPolicies', [...(licData.previousPolicies || []), { id: `prevpol-${Date.now()}`, policyNo: '', sumAssured: 0, mode: '', doc: '', planAndTerm: '' }]);
    const handleRemovePrevPolicy = (index: number) => onLicChange('previousPolicies', (licData.previousPolicies || []).filter((_, i) => i !== index));
    const handlePrevPolicyChange = (index: number, field: keyof LICPreviousPolicy, value: any) => onLicChange('previousPolicies', (licData.previousPolicies || []).map((p, i) => i === index ? { ...p, [field]: value } : p));
    const handleAddFamilyMember = () => onLicChange('familyDetails', [...(licData.familyDetails || []), { relation: 'Father', isAlive: true }]);
    const handleRemoveFamilyMember = (index: number) => onLicChange('familyDetails', (licData.familyDetails || []).filter((_, i) => i !== index));
    const handleFamilyMemberChange = (index: number, field: keyof LICFamilyMember, value: any) => {
        const updatedFamily = [...(licData.familyDetails || [])];
        if (field === 'isAlive') {
            const newMember = { ...updatedFamily[index], isAlive: value };
            if(value) { delete newMember.ageAtDeath; delete newMember.causeOfDeath; } else { delete newMember.age; delete newMember.stateOfHealth; }
            updatedFamily[index] = newMember;
        } else { updatedFamily[index] = { ...updatedFamily[index], [field]: value }; }
        onLicChange('familyDetails', updatedFamily);
    };
    const selectClasses = 'px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary';
    return (
        <div className="space-y-6 animate-fade-in">
             <FormSection title="Personal Information">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     <Input label="Father's Name" value={licData.fatherName || ''} onChange={(e) => onLicChange('fatherName', e.target.value)} disabled={isReadOnly} />
                     <Input label="Mother's Name" value={licData.motherName || ''} onChange={(e) => onLicChange('motherName', e.target.value)} disabled={isReadOnly} />
                     {policyHolderType === 'Family' && (<Input label="Spouse's Full Name" value={licData.spouseName || ''} onChange={(e) => onLicChange('spouseName', e.target.value)} disabled={data.maritalStatus !== 'Married' || isReadOnly}/>)}
                     <Input label="Date of Birth" type="date" value={licData.dob || ''} onChange={(e) => onLicChange('dob', e.target.value)} disabled={isReadOnly} />
                     <Input label="Place of Birth" value={licData.placeOfBirth || ''} onChange={(e) => onLicChange('placeOfBirth', e.target.value)} disabled={isReadOnly} />
                 </div>
             </FormSection>

             <FormSection title="Contact & Identity Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="md:col-span-2"><Input label="Address" value={licData.address || ''} onChange={(e) => onLicChange('address', e.target.value)} disabled={isReadOnly} /></div>
                    <Input label="Mobile Number 1" type="tel" value={licData.mobile1 || ''} onChange={(e) => onLicChange('mobile1', e.target.value)} disabled={isReadOnly} />
                    <Input label="Mobile Number 2" type="tel" value={licData.mobile2 || ''} onChange={(e) => onLicChange('mobile2', e.target.value)} disabled={isReadOnly} />
                    <Input label="Email Address" type="email" value={licData.email || ''} onChange={(e) => onLicChange('email', e.target.value)} disabled={isReadOnly} />
                    <Input label="PAN Card" value={licData.panCard || ''} onChange={(e) => onLicChange('panCard', e.target.value)} disabled={isReadOnly} />
                    <div className="md:col-span-2"><Input label="Aadhaar Number" value={licData.aadhaar || ''} onChange={(e) => onLicChange('aadhaar', e.target.value)} disabled={isReadOnly} /></div>
                </div>
            </FormSection>

             <FormSection title="Nominee Details">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                     <Input label="Nominee's Name" value={licData.nomineeName || ''} onChange={(e) => onLicChange('nomineeName', e.target.value)} disabled={isReadOnly} />
                     <Input label="Nominee's Relationship" value={licData.nomineeRelationship || ''} onChange={(e) => onLicChange('nomineeRelationship', e.target.value)} disabled={isReadOnly} />
                     <Input label="Nominee's Date of Birth" type="date" value={licData.nomineeDob || ''} onChange={(e) => onLicChange('nomineeDob', e.target.value)} disabled={isReadOnly} />
                 </div>
             </FormSection>

            <FormSection title="Physical & Medical Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Height (cm)" type="number" value={licData.height || ''} onChange={(e) => onLicChange('height', parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                    <Input label="Weight (kg)" type="number" value={licData.weight || ''} onChange={(e) => onLicChange('weight', parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                    <Input label="Identification Mark 1" value={licData.identificationMark1 || ''} onChange={(e) => onLicChange('identificationMark1', e.target.value)} disabled={isReadOnly} />
                    <Input label="Identification Mark 2" value={licData.identificationMark2 || ''} onChange={(e) => onLicChange('identificationMark2', e.target.value)} disabled={isReadOnly} />
                    <div className="md:col-span-2 flex items-center gap-4">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Have you undergone any surgeries?</label>
                        <ToggleSwitch enabled={!!licData.hadSurgery} onChange={(enabled) => onLicChange('hadSurgery', enabled)} srLabel="Toggle surgery history" disabled={isReadOnly} />
                    </div>
                    {licData.hadSurgery && (
                        <div className="md:col-span-2 animate-fade-in">
                            <Input label="If yes, give details" value={licData.surgeryDetails || ''} onChange={(e) => onLicChange('surgeryDetails', e.target.value)} disabled={isReadOnly} />
                        </div>
                    )}
                </div>
            </FormSection>

            <FormSection title="Education & Employment">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Educational Qualification" value={licData.educationalQualification || ''} onChange={(e) => onLicChange('educationalQualification', e.target.value)} disabled={isReadOnly} />
                    <Input label="Occupation" value={licData.occupation || ''} onChange={(e) => onLicChange('occupation', e.target.value)} disabled={isReadOnly} />
                    <Input label="Present Occupation" value={licData.presentOccupation || ''} onChange={(e) => onLicChange('presentOccupation', e.target.value)} disabled={isReadOnly} />
                    <Input label="Annual Income" type="number" value={licData.annualIncome || ''} onChange={(e) => onLicChange('annualIncome', parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                    <Input label="Present Employer Name" value={licData.presentEmployerName || ''} onChange={(e) => onLicChange('presentEmployerName', e.target.value)} disabled={isReadOnly} />
                    <Input label="Length of Service" value={licData.lengthOfService || ''} onChange={(e) => onLicChange('lengthOfService', e.target.value)} disabled={isReadOnly} />
                    <Input label="Source of Income" value={licData.sourceOfIncome || ''} onChange={(e) => onLicChange('sourceOfIncome', e.target.value)} disabled={isReadOnly} />
                </div>
            </FormSection>

            <FormSection title="Previous LIC Policy Details">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Policy No</th>
                                <th className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Sum Assured</th>
                                <th className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Mode</th>
                                <th className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">DOC</th>
                                <th className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Plan & Term</th>
                                <th className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(licData.previousPolicies || []).map((policy, index) => (
                                <tr key={policy.id} className="border-b dark:border-gray-700">
                                    <td><Input value={policy.policyNo} onChange={(e) => handlePrevPolicyChange(index, 'policyNo', e.target.value)} disabled={isReadOnly} /></td>
                                    <td><Input type="number" value={policy.sumAssured} onChange={(e) => handlePrevPolicyChange(index, 'sumAssured', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                                    <td><Input value={policy.mode} onChange={(e) => handlePrevPolicyChange(index, 'mode', e.target.value)} disabled={isReadOnly} /></td>
                                    <td><Input type="date" value={policy.doc} onChange={(e) => handlePrevPolicyChange(index, 'doc', e.target.value)} disabled={isReadOnly} /></td>
                                    <td><Input value={policy.planAndTerm} onChange={(e) => handlePrevPolicyChange(index, 'planAndTerm', e.target.value)} disabled={isReadOnly} /></td>
                                    <td><Button variant="danger" size="small" onClick={() => handleRemovePrevPolicy(index)} className="!p-2" disabled={isReadOnly}><Trash2 size={16} /></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button variant="secondary" size="small" onClick={handleAddPrevPolicy} className="mt-2" disabled={isReadOnly}><PlusCircle size={14}/> Add Previous Policy</Button>
            </FormSection>

            <FormSection title="Family Details">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-left">
                            <tr>
                                <th rowSpan={2} className="p-2 border-r dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Relation</th>
                                <th colSpan={2} className="p-2 text-center border-r dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Living</th>
                                <th colSpan={2} className="p-2 text-center text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Dead</th>
                                <th rowSpan={2} className="p-2 text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                            <tr className="border-t dark:border-gray-600">
                                <th className="p-2 font-medium border-r dark:border-gray-600 text-xs text-gray-700 dark:text-gray-400 uppercase tracking-wider">Age</th>
                                <th className="p-2 font-medium border-r dark:border-gray-600 text-xs text-gray-700 dark:text-gray-400 uppercase tracking-wider">State of Health</th>
                                <th className="p-2 font-medium border-r dark:border-gray-600 text-xs text-gray-700 dark:text-gray-400 uppercase tracking-wider">Age at Death</th>
                                <th className="p-2 font-medium text-xs text-gray-700 dark:text-gray-400 uppercase tracking-wider">Year / Cause of Death</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(licData.familyDetails || []).map((member, index) => (
                                <tr key={index} className="border-b dark:border-gray-700">
                                    <td className="border-r dark:border-gray-600 p-1">
                                        <select value={member.relation} onChange={e => handleFamilyMemberChange(index, 'relation', e.target.value as any)} className={`${selectClasses} w-full`} disabled={isReadOnly}>
                                            <option>Father</option><option>Mother</option><option>Brother</option><option>Sister</option><option>Spouse</option><option>Child</option>
                                        </select>
                                        <select value={String(member.isAlive)} onChange={e => handleFamilyMemberChange(index, 'isAlive', e.target.value === 'true')} className={`${selectClasses} w-full mt-1`} disabled={isReadOnly}>
                                            <option value="true">Living</option><option value="false">Deceased</option>
                                        </select>
                                    </td>
                                    {member.isAlive ? (
                                        <>
                                            <td className="border-r dark:border-gray-600"><Input type="number" value={member.age || ''} onChange={e => handleFamilyMemberChange(index, 'age', parseInt(e.target.value) || undefined)} disabled={isReadOnly} /></td>
                                            <td className="border-r dark:border-gray-600"><Input value={member.stateOfHealth || ''} onChange={e => handleFamilyMemberChange(index, 'stateOfHealth', e.target.value)} disabled={isReadOnly} /></td>
                                            <td></td><td></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="border-r dark:border-gray-600"></td><td className="border-r dark:border-gray-600"></td>
                                            <td className="border-r dark:border-gray-600"><Input type="number" value={member.ageAtDeath || ''} onChange={e => handleFamilyMemberChange(index, 'ageAtDeath', parseInt(e.target.value) || undefined)} disabled={isReadOnly} /></td>
                                            <td><Input value={member.causeOfDeath || ''} onChange={e => handleFamilyMemberChange(index, 'causeOfDeath', e.target.value)} disabled={isReadOnly} /></td>
                                        </>
                                    )}
                                    <td><Button variant="danger" size="small" onClick={() => handleRemoveFamilyMember(index)} className="!p-2" disabled={isReadOnly}><Trash2 size={16}/></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button onClick={handleAddFamilyMember} variant="secondary" size="small" className="mt-2" disabled={isReadOnly}><PlusCircle size={14}/> Add Family Member</Button>
            </FormSection>
        </div>
    );
};

// --- REFACTORED Health Insurance Data Sheet ---
const HealthInsuranceDataSheet: React.FC<{ 
    data: HealthInsuranceData; 
    onHealthInsuranceChange: (field: keyof HealthInsuranceData, value: any) => void; 
    isReadOnly: boolean;
}> = ({ data, onHealthInsuranceChange, isReadOnly }) => {
    
    return (
        <div className="space-y-6 animate-fade-in">
             <FormSection title="Insured Member Details (Self / Individual)">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input label="Height (cm)" type="number" value={data.height || ''} onChange={e => onHealthInsuranceChange('height', parseFloat(e.target.value) || undefined)} disabled={isReadOnly} />
                    <Input label="Weight (kg)" type="number" value={data.weight || ''} onChange={e => onHealthInsuranceChange('weight', parseFloat(e.target.value) || undefined)} disabled={isReadOnly} />
                    <Input label="Occupation" value={data.occupation || ''} onChange={e => onHealthInsuranceChange('occupation', e.target.value)} disabled={isReadOnly} />
                    <Input label="Annual Income (₹)" type="number" value={data.annualIncome || ''} onChange={e => onHealthInsuranceChange('annualIncome', parseFloat(e.target.value) || undefined)} disabled={isReadOnly} />
                    <Input label="Father's Name" value={data.fatherName || ''} onChange={e => onHealthInsuranceChange('fatherName', e.target.value)} disabled={isReadOnly} />
                    <Input label="Mother's Name" value={data.motherName || ''} onChange={e => onHealthInsuranceChange('motherName', e.target.value)} disabled={isReadOnly} />
                    <div className="flex items-center gap-2 pt-6">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Good Health?</label>
                        <ToggleSwitch enabled={!!data.isGoodHealth} onChange={val => onHealthInsuranceChange('isGoodHealth', val)} srLabel="Toggle good health status" disabled={isReadOnly} />
                    </div>
                </div>
            </FormSection>
            
            <FormSection title="Proposer & Bank Details">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Proposer's PAN No." value={data.proposerPanNo || ''} onChange={e => onHealthInsuranceChange('proposerPanNo', e.target.value)} disabled={isReadOnly} />
                    <Input label="Proposer's Aadhaar No." value={data.proposerAadharNo || ''} onChange={e => onHealthInsuranceChange('proposerAadharNo', e.target.value)} disabled={isReadOnly} />
                    <Input label="Proposer's Email" type="email" value={data.proposerEmailId || ''} onChange={e => onHealthInsuranceChange('proposerEmailId', e.target.value)} disabled={isReadOnly} />
                    <Input label="Proposer's Phone No." type="tel" value={data.proposerPhoneNo || ''} onChange={e => onHealthInsuranceChange('proposerPhoneNo', e.target.value)} disabled={isReadOnly} />
                    <Input label="Bank Name" value={data.bankName || ''} onChange={e => onHealthInsuranceChange('bankName', e.target.value)} disabled={isReadOnly} />
                    <Input label="Account No." value={data.accountNo || ''} onChange={e => onHealthInsuranceChange('accountNo', e.target.value)} disabled={isReadOnly} />
                    <Input label="IFSC Code" value={data.ifscCode || ''} onChange={e => onHealthInsuranceChange('ifscCode', e.target.value)} disabled={isReadOnly} />
                 </div>
            </FormSection>

            <FormSection title="Nominee Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nominee's Name" value={data.nomineeName || ''} onChange={e => onHealthInsuranceChange('nomineeName', e.target.value)} disabled={isReadOnly} />
                    <Input label="Relationship to Proposer" value={data.nomineeRelationship || ''} onChange={e => onHealthInsuranceChange('nomineeRelationship', e.target.value)} disabled={isReadOnly} />
                    <Input label="Nominee's Date of Birth" type="date" value={data.nomineeDob || ''} onChange={e => onHealthInsuranceChange('nomineeDob', e.target.value)} disabled={isReadOnly} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nominee's Gender</label>
                        <select value={data.nomineeGender || ''} onChange={e => onHealthInsuranceChange('nomineeGender', e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isReadOnly}>
                            <option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option>
                        </select>
                    </div>
                </div>
            </FormSection>
            
            <FormSection title="Medical History Questionnaire">
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="flex items-center gap-4">
                             <ToggleSwitch enabled={!!data.hadMedicalTreatment} onChange={val => onHealthInsuranceChange('hadMedicalTreatment', val)} srLabel="Toggle medical treatment history" disabled={isReadOnly} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">Have you received any medical treatment?</span>
                        </label>
                        {data.hadMedicalTreatment && <Input label="If yes, please provide details:" value={data.medicalTreatmentDetails || ''} onChange={e => onHealthInsuranceChange('medicalTreatmentDetails', e.target.value)} className="mt-2" disabled={isReadOnly} />}
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="flex items-center gap-4">
                            <ToggleSwitch enabled={!!data.hadSurgery} onChange={val => onHealthInsuranceChange('hadSurgery', val)} srLabel="Toggle surgery history" disabled={isReadOnly} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">Have you had surgery?</span>
                        </label>
                         {data.hadSurgery && <Input label="If yes, please provide details:" value={data.surgeryDetails || ''} onChange={e => onHealthInsuranceChange('surgeryDetails', e.target.value)} className="mt-2" disabled={isReadOnly} />}
                    </div>
                     <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="flex items-center gap-4">
                            <ToggleSwitch enabled={!!data.onMedication} onChange={val => onHealthInsuranceChange('onMedication', val)} srLabel="Toggle medication history" disabled={isReadOnly} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">Are you continuously taking medicine/pills?</span>
                        </label>
                         {data.onMedication && <Input label="If yes, please provide details:" value={data.medicationDetails || ''} onChange={e => onHealthInsuranceChange('medicationDetails', e.target.value)} className="mt-2" disabled={isReadOnly} />}
                    </div>
                </div>
            </FormSection>
        </div>
    );
};


// --- REFACTORED Covered Members Manager (Card-based) ---
const EditableCoveredMemberCard: React.FC<{
    member: CoveredMember;
    onUpdate: (updatedMember: CoveredMember) => void;
    onRemove: () => void;
    isReadOnly: boolean;
    spocAddress?: string;
}> = ({ member, onUpdate, onRemove, isReadOnly, spocAddress }) => {
    const isNewMember = !member.name.trim() && !member.dob.trim();
    const [isEditing, setIsEditing] = useState(isNewMember);
    const [localMember, setLocalMember] = useState(member);

    useEffect(() => {
        setLocalMember(member);
        if (!isNewMember && isEditing) {
            setIsEditing(false);
        }
    }, [member, isNewMember]);

    const handleChange = (field: keyof CoveredMember, value: any) => {
        setLocalMember(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (isNewMember && (!localMember.name.trim() || !localMember.dob.trim())) {
            alert('Name and Date of Birth are required for a new member.');
            return;
        }
        onUpdate(localMember);
        setIsEditing(false);
    };
    
    const [addressLine1, addressLine2 = ''] = useMemo(() => (localMember.address || '').split('\n'), [localMember.address]);
    
    const handleAddressChange = useCallback((line: 1 | 2, value: string) => {
        let lines = (localMember.address || '').split('\n');
        if (lines.length < 2) {
            lines = [lines[0] || '', ''];
        }
        if (line === 1) {
            lines[0] = value;
        } else {
            lines[1] = value;
        }
        handleChange('address', lines.join('\n'));
    }, [localMember.address, handleChange]);
    
    const handleCopyAddress = () => {
        if (spocAddress) {
            handleChange('address', spocAddress);
        }
    };


    const handleCancel = () => {
        if (isNewMember) {
            onRemove();
        } else {
            setLocalMember(member);
            setIsEditing(false);
        }
    };

    const selectClasses = 'w-full px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary';

    if (isEditing) {
        return (
            <div className="p-4 rounded-lg shadow-sm border-2 border-brand-primary bg-white dark:bg-gray-800 animate-fade-in space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{isNewMember ? 'Adding New Member' : 'Editing Member Details'}</h4>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="small" onClick={handleCancel}>Cancel</Button>
                        <Button variant="success" size="small" onClick={handleSave}><Save size={14}/> Save</Button>
                    </div>
                </div>

                {!isNewMember && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-800 dark:text-blue-200 text-xs flex items-start gap-2">
                        <Info size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
                            To edit core details like Name or DOB, please go to this member's own profile.
                            Changes made there will automatically update here. You can only edit policy-specific details below.
                        </span>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isNewMember ? (
                        <>
                            <Input label="Name *" value={localMember.name} onChange={e => handleChange('name', e.target.value)} />
                            <Input label="Date of Birth *" type="date" value={localMember.dob} onChange={e => handleChange('dob', e.target.value)} />
                            <Input label="Email" type="email" value={localMember.email || ''} onChange={e => handleChange('email', e.target.value)} />
                            <Input label="Mobile" type="tel" value={localMember.mobile || ''} onChange={e => handleChange('mobile', e.target.value)} />
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date of Birth</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.dob}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mobile</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.mobile || 'N/A'}</p>
                            </div>
                        </>
                    )}
                    
                    <Input label="Relationship *" value={localMember.relationship} onChange={e => handleChange('relationship', e.target.value)} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                        <select value={localMember.gender || ''} onChange={e => handleChange('gender', e.target.value as any)} className={selectClasses}>
                            <option value="">Select...</option><option>Male</option><option>Female</option><option>Transgender</option><option>Other</option>
                        </select>
                    </div>
                    <Input label="Height (cm)" type="number" value={localMember.height || ''} onChange={e => handleChange('height', parseFloat(e.target.value) || undefined)} />
                    <Input label="Weight (kg)" type="number" value={localMember.weight || ''} onChange={e => handleChange('weight', parseFloat(e.target.value) || undefined)} />
                    <Input label="Occupation" value={localMember.occupation || ''} onChange={e => handleChange('occupation', e.target.value)} />
                    <Input label="Annual Income (₹)" type="number" value={localMember.annualIncome || ''} onChange={e => handleChange('annualIncome', parseFloat(e.target.value) || undefined)} />
                    <div className="flex items-center gap-2 pt-6">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Is in Good Health?</label>
                        <ToggleSwitch enabled={!!localMember.isGoodHealth} onChange={val => handleChange('isGoodHealth', val)} srLabel="Toggle good health"/>
                    </div>
                </div>
                {/* UPDATED SECTION */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <Button size="small" variant="light" type="button" onClick={handleCopyAddress}>
                            Copy Primary Customer's Address
                        </Button>
                    </div>
                    {/* Removed className from the Input components to ensure consistent styling */}
                    <Input label="" placeholder="Address Line 1" value={addressLine1} onChange={e => handleAddressChange(1, e.target.value)} />
                    <Input label="" placeholder="Address Line 2" value={addressLine2} onChange={e => handleAddressChange(2, e.target.value)} />
                </div>
            </div>
        )
    }


    return (
        <div className="p-4 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.relationship} &bull; DOB: {member.dob}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{member.address?.split('\n').join(', ') || 'No address set'}</p>
                </div>
                 <div className="flex items-center gap-2">
                    {!isReadOnly && <Button variant="light" size="small" onClick={() => setIsEditing(true)}><Edit2 size={14}/> Edit</Button>}
                    {!isReadOnly && <Button variant="danger" size="small" className="!p-1.5" onClick={onRemove}><Trash2 size={14}/></Button>}
                </div>
            </div>
        </div>
    );
};

const CoveredMembersManager: React.FC<{ 
    coveredMembers: CoveredMember[], 
    onMembersChange: (newMembers: CoveredMember[]) => void, 
    isReadOnly: boolean,
    spocAddress?: string;
}> = ({ coveredMembers, onMembersChange, isReadOnly, spocAddress }) => {
    
    const handleAdd = () => onMembersChange([...coveredMembers, { 
        id: `mem-${Date.now()}`, 
        name: '', 
        relationship: '', 
        dob: '', 
    }]);

    const handleUpdate = (index: number, updatedMember: CoveredMember) => {
        const newMembers = [...coveredMembers];
        newMembers[index] = updatedMember;
        onMembersChange(newMembers);
    };

    const handleRemove = (index: number) => {
        onMembersChange(coveredMembers.filter((_, i) => i !== index));
    };
    
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {coveredMembers.map((m, i) => (
                    <EditableCoveredMemberCard
                        key={m.id}
                        member={m}
                        onUpdate={(updated) => handleUpdate(i, updated)}
                        onRemove={() => handleRemove(i)}
                        isReadOnly={isReadOnly}
                        spocAddress={spocAddress}
                    />
                ))}
            </div>
             {!isReadOnly && (
                <Button variant="secondary" size="small" onClick={handleAdd}>
                    <PlusCircle size={14}/> Add Covered Member
                </Button>
            )}
        </div>
    );
};

const PolicyEditor: React.FC<{
    policy: Policy;
    data: Partial<Member>;
    handlePolicyChange: (id: string, field: keyof Policy, value: any) => void;
    handleGeneralInsuranceDataChange: (policyId: string, field: string, value: any) => void;
    handleLicDataChange: (policyId: string, field: keyof LICData, value: any) => void;
    handleHealthInsuranceDataChange: (policyId: string, field: keyof HealthInsuranceData, value: any) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, policyId: string) => void;
    handlePaymentVerification: (policyId: string) => Promise<void>;
    verifyingPayment: string | null;
    onGenerateProposal: (member: Member, policy: Policy) => void;
    onSave: (memberData: Member, closeModal?: boolean) => void;
    currentUser: User | null;
    schemes: SchemeMaster[];
    companies: Company[];
    setEditingPolicyId: (id: string | null) => void;
    getPaymentStatusIcon: (status?: string) => React.ReactNode;
    addToast: (message: string, type?: 'success' | 'error') => void;
    insuranceTypes: InsuranceTypeMaster[];
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    isReadOnly: boolean;
}> = ({ policy, data, handlePolicyChange, handleGeneralInsuranceDataChange, handleLicDataChange, handleHealthInsuranceDataChange, handleFileUpload, handlePaymentVerification, verifyingPayment, onGenerateProposal, onSave, currentUser, schemes, companies, setEditingPolicyId, getPaymentStatusIcon, addToast, insuranceTypes, insuranceFields, onUpdateInsuranceFields, isReadOnly }) => {
    
    const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType | ''>('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const policyIdRef = useRef<string | null>(null);
    
    // State for creating new custom fields
    const [isAddingField, setIsAddingField] = useState(false);
    const [newFieldInfo, setNewFieldInfo] = useState({ name: '', type: 'field' as 'field' | 'table', rows: 2, cols: 2 });

    useEffect(() => {
        if (policy) {
            setSelectedPolicyType(policy.policyType || '');
            
            if (policy.id !== policyIdRef.current) {
                const scheme = schemes.find(s => s.name === policy.schemeName);
                setSelectedCompanyId(scheme?.companyId || '');
                policyIdRef.current = policy.id;
            }
        }
    }, [policy, schemes]);

    const handleDynamicDataChange = useCallback((fieldName: string, value: any) => {
        const newDynamicData = { ...(policy.dynamicData || {}), [fieldName]: value };
        handlePolicyChange(policy.id, 'dynamicData', newDynamicData);
    }, [policy.id, policy.dynamicData, handlePolicyChange]);

    const removeDynamicField = useCallback((key: string) => {
        const { [key]: _, ...rest } = (policy.dynamicData || {});
        handlePolicyChange(policy.id, 'dynamicData', rest);
    }, [policy.id, policy.dynamicData, handlePolicyChange]);

    const camelCase = (str: string) => str.replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => chr ? chr.toUpperCase() : '').replace(/^./, (c) => c.toLowerCase());

    const handleConfirmAddField = useCallback(() => {
        const { name, type } = newFieldInfo;
        if (!name.trim()) {
            addToast('Field name cannot be empty.', 'error');
            return;
        }

        const fieldName = camelCase(name.trim());
        const existingDynamicField = policy.dynamicData && name.trim() in policy.dynamicData;
        const relevantInsuranceTypeId = insuranceTypes.find(it => it.name === (policy.policyType === 'General Insurance' ? policy.generalInsuranceType : policy.policyType))?.id;
        
        if (!relevantInsuranceTypeId) {
            addToast('Cannot add field: policy type is not configured in master data.', 'error');
            return;
        }

        const existingMasterField = insuranceFields.some(f => f.insuranceTypeId === relevantInsuranceTypeId && (f.fieldName === fieldName || f.label.toLowerCase() === name.trim().toLowerCase()));

        if (existingDynamicField || existingMasterField) {
            addToast('A field with this name already exists.', 'error');
            return;
        }

        if (type === 'field') {
            const maxOrder = Math.max(0, ...insuranceFields.filter(f => f.insuranceTypeId === relevantInsuranceTypeId).map(f => f.order));
            
            const newField: InsuranceFieldMaster = {
                id: `if-custom-${Date.now()}`,
                insuranceTypeId: relevantInsuranceTypeId!,
                fieldName: fieldName,
                label: name.trim(),
                fieldType: 'text',
                order: maxOrder + 1,
                active: true,
            };
            onUpdateInsuranceFields([...insuranceFields, newField]);
            addToast(`Field "${name.trim()}" added to master data.`, 'success');
        }

        let newValue: any;
        if (type === 'field') {
            newValue = '';
        } else {
            const { rows, cols } = newFieldInfo;
            newValue = {
                __type: 'table',
                headers: Array.from({ length: cols }, (_, i) => `Column ${i + 1}`),
                rows: Array.from({ length: rows }, () => Array(cols).fill('')),
            };
        }
        
        handleDynamicDataChange(name.trim(), newValue);
        
        setIsAddingField(false);
        setNewFieldInfo({ name: '', type: 'field', rows: 2, cols: 2 });
    }, [newFieldInfo, policy, addToast, handleDynamicDataChange, insuranceTypes, insuranceFields, onUpdateInsuranceFields]);
    
    const companyIdsInSchemesForType = useMemo(() => {
        if (!selectedPolicyType) return new Set<string>();
        return new Set(schemes.filter(s => s.type === selectedPolicyType).map(s => s.companyId));
    }, [selectedPolicyType, schemes]);

    const filteredCompanies = useMemo(() => {
        if (!selectedPolicyType) return [];
        return companies.filter(c => c.active && companyIdsInSchemesForType.has(c.id));
    }, [selectedPolicyType, companies, companyIdsInSchemesForType]);

    const filteredSchemes = useMemo(() => {
        if (!selectedCompanyId || !selectedPolicyType) return [];
        return schemes.filter(s => {
            const companyMatch = s.companyId === selectedCompanyId;
            const typeMatch = s.type === selectedPolicyType;
            const activeMatch = s.active;
    
            if (selectedPolicyType === 'General Insurance') {
                const generalTypeMatch = s.generalInsuranceType === policy.generalInsuranceType;
                return companyMatch && typeMatch && activeMatch && generalTypeMatch;
            }
    
            return companyMatch && typeMatch && activeMatch;
        });
    }, [selectedCompanyId, selectedPolicyType, schemes, policy.generalInsuranceType]);

    const generalInsuranceTypes = useMemo(() => {
        return insuranceTypes.filter(it => it.active && it.name !== 'Life Insurance' && it.name !== 'Health Insurance');
    }, [insuranceTypes]);
    
    const relevantInsuranceTypeId = useMemo(() => {
        const typeName = policy.policyType === 'General Insurance' ? policy.generalInsuranceType : policy.policyType;
        return insuranceTypes.find(it => it.name === typeName)?.id;
    }, [policy, insuranceTypes]);

    const dynamicFields = useMemo(() => {
        if (!relevantInsuranceTypeId) return [];
        return insuranceFields
            .filter(field => field.insuranceTypeId === relevantInsuranceTypeId && field.active)
            .sort((a, b) => a.order - b.order);
    }, [relevantInsuranceTypeId, insuranceFields]);

    const dynamicFieldNames = useMemo(() => new Set(dynamicFields.map(f => f.fieldName)), [dynamicFields]);
    
    const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    
    const displayPremium = useMemo(() => {
        return getPremiumForFrequency(policy.premium, policy.premiumFrequency);
    }, [policy.premium, policy.premiumFrequency]);


    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-brand-primary animate-fade-in shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-brand-dark dark:text-white">Edit Policy Details</h3>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setEditingPolicyId(null)}><X size={16}/> Done</Button>
                    <Button onClick={() => onSave(data as Member, false)} variant="success" disabled={isReadOnly}><Save size={16}/> Save Changes</Button>
                </div>
            </div>
            <div className="space-y-6">
                 <FormSection title="Core Policy Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Type</label>
                            <select 
                                value={selectedPolicyType} 
                                onChange={(e) => {
                                    const newType = e.target.value as PolicyType;
                                    setSelectedCompanyId('');
                                    handlePolicyChange(policy.id, 'policyType', newType);
                                }} 
                                className={selectClasses} disabled={isReadOnly}>
                                <option value="" disabled>Select Type...</option>
                                <option>Life Insurance</option>
                                <option>Health Insurance</option>
                                <option>General Insurance</option>
                            </select>
                        </div>
                        <div className={selectedPolicyType ? '' : 'opacity-50'}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency/Company</label>
                            <select value={selectedCompanyId} onChange={(e) => {setSelectedCompanyId(e.target.value); handlePolicyChange(policy.id, 'schemeName', '');}} className={selectClasses} disabled={!selectedPolicyType || isReadOnly}>
                                <option value="">Select Company...</option>
                                {filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className={selectedCompanyId ? '' : 'opacity-50'}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme</label>
                            <select value={policy.schemeName || ''} onChange={(e) => handlePolicyChange(policy.id, 'schemeName', e.target.value)} className={selectClasses} disabled={!selectedCompanyId || isReadOnly}>
                                <option value="">Select Scheme...</option>
                                {filteredSchemes.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Holder Type</label>
                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300"><input type="radio" value="Individual" checked={policy.policyHolderType === 'Individual'} onChange={(e) => handlePolicyChange(policy.id, 'policyHolderType', e.target.value as any)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600" disabled={isReadOnly}/><UserIcon size={14} className="mr-1"/> Individual</label>
                                <div className="relative flex items-center gap-2 text-gray-800 dark:text-gray-300">
                                    <input 
                                        type="radio" 
                                        value="Family" 
                                        checked={policy.policyHolderType === 'Family'} 
                                        onChange={(e) => handlePolicyChange(policy.id, 'policyHolderType', e.target.value as any)} 
                                        className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                                        disabled={isReadOnly}
                                    />
                                    <Users size={14} className="mr-1"/> Family
                                </div>
                            </div>
                        </div>
                        {selectedPolicyType === 'General Insurance' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Insurance Type</label>
                                <select
                                    value={policy.generalInsuranceType || ''}
                                    onChange={(e) => handlePolicyChange(policy.id, 'generalInsuranceType', e.target.value as GeneralInsuranceType)}
                                    className={selectClasses}
                                    disabled={isReadOnly}
                                >
                                    <option value="">Select Type...</option>
                                    {generalInsuranceTypes.map(type => (
                                        <option key={type.id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </FormSection>

                {policy.policyHolderType === 'Family' && (
                    <FormSection title="Covered Family Members">
                        <CoveredMembersManager
                            coveredMembers={policy.coveredMembers || []}
                            onMembersChange={(newMembers) => handlePolicyChange(policy.id, 'coveredMembers', newMembers)}
                            isReadOnly={isReadOnly}
                            spocAddress={data.address}
                        />
                    </FormSection>
                )}
                
                <FormSection title="Coverage & Premium">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <Input label="Coverage (Sum Assured)" type="number" value={policy.coverage || ''} onChange={(e) => handlePolicyChange(policy.id, 'coverage', parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                        <Input label="Premium (Yearly)" type="number" value={policy.premium || ''} onChange={(e) => handlePolicyChange(policy.id, 'premium', parseFloat(e.target.value) || 0)} disabled={isReadOnly}/>
                        <Input label="Renewal Date" type="date" value={policy.renewalDate || ''} onChange={(e) => handlePolicyChange(policy.id, 'renewalDate', e.target.value)} disabled={isReadOnly} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium Frequency</label>
                            <select 
                                value={policy.premiumFrequency || 'Yearly'} 
                                onChange={(e) => handlePolicyChange(policy.id, 'premiumFrequency', e.target.value as any)} 
                                className={selectClasses}
                                disabled={isReadOnly}
                            >
                                <option>Yearly</option>
                                <option>Half-Yearly</option>
                                <option>Quarterly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <Input label={`Premium (${policy.premiumFrequency || 'Yearly'})`} type="number" value={displayPremium.toFixed(0)} readOnly disabled />
                        </div>
                    </div>
                </FormSection>
                
                <div className="grid grid-cols-2 gap-4 items-center p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Policy Status</label>
                        <ToggleSwitch enabled={policy.status === 'Active'} onChange={(enabled) => handlePolicyChange(policy.id, 'status', enabled ? 'Active' : 'Inactive')} srLabel="Toggle policy status" disabled={isReadOnly || (currentUser?.role === 'Advisor' && policy.status === 'Active')}/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Document Received</label>
                        <ToggleSwitch enabled={!!policy.documentReceived} onChange={(enabled) => handlePolicyChange(policy.id, 'documentReceived', enabled)} srLabel="Toggle document received status" disabled={isReadOnly}/>
                    </div>
                </div>
                
                {selectedPolicyType === 'Life Insurance' && (
                    <LICForm data={data} licData={policy.licData || {}} onLicChange={(field, value) => handleLicDataChange(policy.id, field, value)} policyHolderType={policy.policyHolderType} isReadOnly={isReadOnly} />
                )}
                
                {selectedPolicyType === 'Health Insurance' && (
                     <HealthInsuranceDataSheet 
                        data={policy.healthInsuranceData || {}} 
                        onHealthInsuranceChange={(field, value) => handleHealthInsuranceDataChange(policy.id, field, value)} 
                        isReadOnly={isReadOnly}
                     />
                )}

                {selectedPolicyType === 'General Insurance' && policy.generalInsuranceType && (<FormSection title={`General Insurance Data Sheet (${policy.generalInsuranceType})`}><GeneralInsuranceSheet policy={policy} onDataChange={(field, value) => handleGeneralInsuranceDataChange(policy.id, field, value)} onTravelersChange={(travelers) => handlePolicyChange(policy.id, 'generalInsuranceData', { ...(policy.generalInsuranceData || {}), travelers })} isReadOnly={isReadOnly}/></FormSection>)}
                
                <FormSection title="Custom & Additional Data Fields">
                     <div className="space-y-4">
                        {dynamicFields.map(field => (
                            <Input
                                key={field.id}
                                label={field.label}
                                type={field.fieldType}
                                value={policy.dynamicData?.[field.fieldName] || ''}
                                onChange={e => handleDynamicDataChange(field.fieldName, e.target.value)}
                                disabled={isReadOnly}
                            />
                        ))}

                        <hr className="my-4 dark:border-gray-600"/>

                        {policy.dynamicData && Object.entries(policy.dynamicData).map(([key, value]) => {
                             if (dynamicFieldNames.has(key)) return null;

                             if (typeof value === 'object' && value !== null && value?.__type === 'table') {
                                 return (
                                     <EditableTable
                                         key={key}
                                         name={key}
                                         tableData={value}
                                         onDataChange={handleDynamicDataChange}
                                         onRemoveField={removeDynamicField}
                                         isReadOnly={isReadOnly}
                                     />
                                 );
                             } else if (typeof value !== 'object' || value === null) {
                                 return (
                                     <div key={key} className="flex items-end gap-2">
                                         <Input
                                             label={key}
                                             value={String(value || '')}
                                             onChange={e => handleDynamicDataChange(key, e.target.value)}
                                             className="flex-grow"
                                             disabled={isReadOnly}
                                         />
                                         <Button variant="danger" size="small" className="!p-2" onClick={() => removeDynamicField(key)} disabled={isReadOnly}>
                                             <Trash2 size={16} />
                                         </Button>
                                     </div>
                                 );
                             }
                             return null;
                        })}
                    </div>
                    
                    {isAddingField ? (
                        <div className="p-4 mt-4 border-t dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg animate-fade-in space-y-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white">Create New Custom Field</h4>
                            <Input 
                                label="Field Name" 
                                value={newFieldInfo.name}
                                onChange={e => setNewFieldInfo(s => ({ ...s, name: e.target.value }))}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Type</label>
                                <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                    <button type="button" onClick={() => setNewFieldInfo(s => ({ ...s, type: 'field' }))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${newFieldInfo.type === 'field' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Simple Field</button>
                                    <button type="button" onClick={() => setNewFieldInfo(s => ({ ...s, type: 'table' }))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${newFieldInfo.type === 'table' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Table</button>
                                </div>
                            </div>
                            {newFieldInfo.type === 'table' && (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                    <Input label="Initial Rows" type="number" min="1" value={newFieldInfo.rows} onChange={e => setNewFieldInfo(s => ({...s, rows: Math.max(1, parseInt(e.target.value) || 1)}))} />
                                    <Input label="Initial Columns" type="number" min="1" value={newFieldInfo.cols} onChange={e => setNewFieldInfo(s => ({...s, cols: Math.max(1, parseInt(e.target.value) || 1)}))} />
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" size="small" onClick={() => setIsAddingField(false)}>Cancel</Button>
                                <Button variant="success" size="small" onClick={handleConfirmAddField}>Add</Button>
                            </div>
                        </div>
                    ) : (
                        <Button onClick={() => setIsAddingField(true)} variant="light" size="small" className="mt-3" disabled={isReadOnly}>
                            <Plus size={14} /> Add Custom Field
                        </Button>
                    )}
                </FormSection>

                <FormSection title="Payment & Verification">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Payment Verification</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                                    <select value={policy.paymentMode || ''} onChange={(e) => handlePolicyChange(policy.id, 'paymentMode', e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isReadOnly}>
                                        <option value="" disabled>Select mode...</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>NetBanking</option>
                                    </select>
                                </div>
                                {policy.paymentMode !== 'Cash' && (
                                    <div className="animate-fade-in space-y-3">
                                        <div className="flex items-center gap-2">
                                            <label htmlFor={`payment-upload-${policy.id}`} className="relative cursor-pointer">
                                                <Button as="span" variant="light" className="w-full flex items-center justify-center" disabled={isReadOnly}><UploadCloud size={16}/> Upload Proof</Button>
                                                <input type="file" id={`payment-upload-${policy.id}`} className="sr-only" onChange={(e) => handleFileUpload(e, policy.id)} accept="image/*,application/pdf" disabled={isReadOnly} />
                                            </label>
                                            <Button onClick={() => handlePaymentVerification(policy.id)} disabled={!policy.paymentProofUrl || !!verifyingPayment || isReadOnly} variant="primary">
                                                {verifyingPayment === policy.id ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />} Verify
                                            </Button>
                                        </div>
                                        {policy.paymentProofUrl && <a href={policy.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 truncate block">{policy.paymentProofFilename || 'View Uploaded Proof'}</a>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Verification Status</h4>
                            <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg min-h-[5rem] flex items-center">
                                {policy.paymentDetails ? (
                                    <div className="flex items-center gap-3">
                                        {getPaymentStatusIcon(policy.paymentDetails.status)}
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{policy.paymentDetails.status}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{policy.paymentDetails.statusReason}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {policy.paymentDetails.transactionId}</p>
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting verification...</p>}
                            </div>
                        </div>
                    </div>
                </FormSection>
                
                {currentUser?.role === 'Admin' && policy.commission && (
                    <FormSection title="Commission Details (Admin Only)">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <Input 
                                label="Commission Amount (₹)" 
                                type="number" 
                                value={policy.commission.amount || ''} 
                                onChange={(e) => handlePolicyChange(policy.id, 'commission', { ...policy.commission, amount: parseFloat(e.target.value) || 0 })}
                                disabled={isReadOnly}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Status</label>
                                <select 
                                    value={policy.commission.status}
                                    onChange={(e) => handlePolicyChange(policy.id, 'commission', { ...policy.commission, status: e.target.value as any, paidDate: e.target.value === 'Paid' ? (policy.commission?.paidDate || new Date().toISOString().split('T')[0]) : undefined })}
                                    className={selectClasses}
                                    disabled={isReadOnly}
                                >
                                    <option>Pending</option>
                                    <option>Paid</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>
                            <Input 
                                label="Paid Date" 
                                type="date" 
                                value={policy.commission.paidDate || ''}
                                onChange={(e) => handlePolicyChange(policy.id, 'commission', { ...policy.commission, paidDate: e.target.value })}
                                disabled={policy.commission.status !== 'Paid' || isReadOnly}
                            />
                        </div>
                    </FormSection>
                )}
                <div className="pt-4 flex justify-end items-center">
                    <Button onClick={() => onGenerateProposal(data as Member, policy)} variant="success" disabled={isReadOnly}><FileSignature size={16} /> Generate Proposal</Button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
interface PoliciesTabProps {
    allMembers: Member[];
    data: Partial<Member>;
    onChange: (field: keyof Member, value: any) => void;
    onSave: (memberData: Member, closeModal?: boolean) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    onGenerateProposal: (member: Member, policy: Policy) => void;
    currentUser: User | null;
    onFindUpsell: (member: Member) => Promise<string | null>;
    schemes: SchemeMaster[];
    companies: Company[];
    insuranceTypes: InsuranceTypeMaster[];
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    editingPolicyId: string | null;
    setEditingPolicyId: (id: string | null) => void;
}
export const PoliciesTab: React.FC<PoliciesTabProps> = ({ 
    allMembers,
    data, 
    onChange,
    onSave,
    addToast, 
    onGenerateProposal, 
    currentUser, 
    onFindUpsell, 
    schemes, 
    companies, 
    insuranceTypes,
    insuranceFields,
    onUpdateInsuranceFields,
    editingPolicyId,
    setEditingPolicyId
}) => {
    const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
    const [isFindingUpsell, setIsFindingUpsell] = useState(false);
    const [localUpsellSuggestion, setLocalUpsellSuggestion] = useState<string | null | undefined>(undefined);

    const displayPolicies = useMemo(() => {
        const ownPolicies = data.policies || [];
        const inheritedPolicies: Policy[] = [];
    
        // If the current member is a dependent (has a spocId)
        if (data.spocId) {
            const spoc = allMembers.find(m => m.memberId === data.spocId);
            if (spoc) {
                // A member who was relieved should see the family policies they were part of.
                const isRelieved = !!data.relievedTimestamp;
    
                (spoc.policies || []).forEach(policy => {
                    if (policy.policyHolderType === 'Family') {
                        const isCurrentlyCovered = policy.coveredMembers?.some(cm => 
                            cm.name.toLowerCase() === data.name?.toLowerCase() && cm.dob === data.dob
                        );
                        
                        // Show the policy if the member is currently covered OR they are relieved.
                        if (isCurrentlyCovered || isRelieved) {
                            if (!ownPolicies.some(p => p.id === policy.id)) {
                                inheritedPolicies.push({ 
                                    ...policy, 
                                    isLegacyFamilyPolicy: true, 
                                    id: `${policy.id}-inherited-${data.id}` 
                                });
                            }
                        }
                    }
                });
            }
        }
        
        return [...ownPolicies, ...inheritedPolicies];
    }, [data, allMembers]);

    const editingPolicy = useMemo(() => {
        if (!editingPolicyId) return null;
        // Search in all displayable policies, including inherited ones.
        return displayPolicies.find(p => p.id === editingPolicyId) || null;
    }, [editingPolicyId, displayPolicies]);

    const isReadOnly = (policy: Policy) => policy.isLegacyFamilyPolicy === true;

    const handleAddNewPolicy = () => {
        const newPolicy: Policy = { id: `pol-${Date.now()}`, policyType: 'Health Insurance', coverage: 0, premium: 0, renewalDate: '', status: 'Active', documentReceived: false, policyHolderType: 'Individual', coveredMembers: [] };
        onChange('policies', [...(data.policies || []), newPolicy]);
        setEditingPolicyId(newPolicy.id);
    };

    const handleDeletePolicy = (id: string) => {
        if (window.confirm('Are you sure you want to delete this policy? This action is permanent and will save immediately.')) {
            const updatedPolicies = (data.policies || []).filter(p => p.id !== id);
            onChange('policies', updatedPolicies);
            const updatedMember = { ...data, policies: updatedPolicies };
            onSave(updatedMember as Member, false);
            addToast("Policy deleted.", "success");
        }
    };

    const handlePolicyChange = useCallback((id: string, field: keyof Policy, value: any) => {
        const updatedPolicies = (data.policies || []).map(p => {
            if (p.id === id) {
                const oldPolicy = { ...p };
                let newPolicy = { ...p, [field]: value };
    
                if (field === 'coverage' && (p.premium === 0 || !p.premium) ) { 
                    newPolicy.premium = calculatePremium(newPolicy.policyType, newPolicy.coverage); 
                }
                
                if (field === 'paymentMode' && value === 'Cash') {
                    newPolicy.paymentDetails = { transactionId: `cash-${Date.now()}`, amount: String(newPolicy.premium), date: new Date().toISOString().split('T')[0], status: 'Verified', statusReason: 'Payment made in cash. Auto-verified.' };
                    newPolicy.commission = { amount: newPolicy.premium * 0.1, status: 'Pending' };
                    newPolicy.paymentProofUrl = undefined; newPolicy.paymentProofFilename = undefined;
                } else if (field === 'paymentMode' && value !== 'Cash' && p.paymentMode === 'Cash') { 
                    newPolicy.paymentDetails = undefined; 
                    newPolicy.commission = undefined; 
                }
                
                const isNewPolicyType = field === 'policyType' && value !== oldPolicy.policyType;
                if (isNewPolicyType) {
                    newPolicy.schemeName = '';
                    newPolicy.generalInsuranceType = undefined;
                    newPolicy.generalInsuranceData = {};
                    if (value !== 'General Insurance') {
                        delete newPolicy.generalInsuranceType;
                        delete newPolicy.generalInsuranceData;
                    }
                    if (newPolicy.coverage > 0 && (p.premium === 0 || !p.premium) ) {
                       newPolicy.premium = calculatePremium(newPolicy.policyType, newPolicy.coverage);
                    }
                }
                
                if (field === 'generalInsuranceType') {
                    newPolicy.schemeName = '';
                }
                
                return newPolicy;
            }
            return p;
        });
        onChange('policies', updatedPolicies);
    }, [data.policies, onChange]);
    
    const handleGeneralInsuranceDataChange = useCallback((policyId: string, field: string, value: any) => onChange('policies', (data.policies || []).map(p => p.id === policyId ? { ...p, generalInsuranceData: { ...(p.generalInsuranceData || {}), [field]: value } } : p)), [data.policies, onChange]);
    const handleLicDataChange = useCallback((policyId: string, field: keyof LICData, value: any) => onChange('policies', (data.policies || []).map(p => p.id === policyId ? { ...p, licData: { ...(p.licData || {}), [field]: value } } : p)), [data.policies, onChange]);
    const handleHealthInsuranceDataChange = useCallback((policyId: string, field: keyof HealthInsuranceData, value: any) => onChange('policies', (data.policies || []).map(p => p.id === policyId ? { ...p, healthInsuranceData: { ...(p.healthInsuranceData || {}), [field]: value } } : p)), [data.policies, onChange]);
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, policyId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onChange('policies', (data.policies || []).map(p => p.id === policyId ? { ...p, paymentProofUrl: url, paymentProofFilename: file.name } : p));
        }
    };

    const handlePaymentVerification = async (policyId: string) => {
        const policy = data.policies?.find(p => p.id === policyId);
        if (!policy?.paymentProofUrl) return addToast("Please upload a payment proof first.", 'error');
        setVerifyingPayment(policyId);
        try {
            const response = await fetch(policy.paymentProofUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const paymentDetails = await analyzePaymentProof(base64String, blob.type, policy.premium, addToast);
                onChange('policies', (data.policies || []).map(p => p.id === policyId ? { ...p, paymentDetails, commission: { amount: p.premium * 0.1, status: 'Pending'} } : p));
                addToast("Payment analysis complete!", "success");
            };
        } catch (error) { addToast("Failed to verify payment proof.", 'error'); } 
        finally { setVerifyingPayment(null); }
    };

    const handleFindUpsellClick = async () => {
        setIsFindingUpsell(true);
        const suggestion = await onFindUpsell(data as Member);
        setLocalUpsellSuggestion(suggestion);
        setIsFindingUpsell(false);
    };
    
    const getPaymentStatusIcon = (status?: string) => {
        switch (status) {
            case 'Verified': return <CheckCircle className="text-green-500" />;
            case 'Mismatch': return <AlertTriangle className="text-orange-500" />;
            case 'Unverified': return <AlertTriangle className="text-yellow-500" />;
            case 'Error': return <XCircle className="text-red-500" />;
            default: return null;
        }
    };

    const PolicyCard = ({ policy }: { policy: Policy }) => {
        const displayPremium = getPremiumForFrequency(policy.premium, policy.premiumFrequency);
        const typeStyles: Record<string, string> = {
            'Life Insurance': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
            'Health Insurance': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
            'General Insurance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
        };
        const policyTypeLabel = policy.policyType === 'General Insurance' ? `${policy.policyType} (${policy.generalInsuranceType})` : policy.policyType;

        return (
            <div className={`p-4 rounded-lg shadow-sm border ${isReadOnly(policy) ? 'bg-gray-100 dark:bg-gray-700/50 opacity-70' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start">
                    <div>
                         <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${typeStyles[policy.policyType] || 'bg-gray-100 text-gray-800'}`}>
                            {policyTypeLabel}
                        </span>
                        <h4 className="font-semibold text-brand-dark dark:text-white mt-1">{policy.schemeName || 'Unspecified Scheme'}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="light" size="small" onClick={() => setEditingPolicyId(policy.id)}><Edit2 size={14}/> View/Edit</Button>
                         {!isReadOnly(policy) && <Button variant="danger" size="small" className="!p-1.5 h-7 w-7" onClick={() => handleDeletePolicy(policy.id)}><Trash2 size={14}/></Button>}
                    </div>
                </div>
                {isReadOnly(policy) && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">This is a view-only policy from a family plan.</p>}
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-gray-500 dark:text-gray-400">Coverage</p><p className="font-semibold text-gray-800 dark:text-gray-200">₹{policy.coverage.toLocaleString('en-IN')}</p></div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Premium ({policy.premiumFrequency || 'Yearly'})</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">₹{displayPremium.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div><p className="text-gray-500 dark:text-gray-400">Annual Renewal</p><p className="font-semibold text-gray-800 dark:text-gray-200">{policy.renewalDate ? new Date(policy.renewalDate).toLocaleDateString('en-GB') : 'Invalid Date'}</p></div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Status</p>
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                            {policy.status}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {editingPolicy ? (
                <PolicyEditor 
                    policy={editingPolicy}
                    data={data}
                    handlePolicyChange={handlePolicyChange}
                    handleGeneralInsuranceDataChange={handleGeneralInsuranceDataChange}
                    handleLicDataChange={handleLicDataChange}
                    handleHealthInsuranceDataChange={handleHealthInsuranceDataChange}
                    handleFileUpload={handleFileUpload}
                    handlePaymentVerification={handlePaymentVerification}
                    verifyingPayment={verifyingPayment}
                    onGenerateProposal={onGenerateProposal}
                    onSave={onSave}
                    currentUser={currentUser}
                    schemes={schemes}
                    companies={companies}
                    setEditingPolicyId={setEditingPolicyId}
                    getPaymentStatusIcon={getPaymentStatusIcon}
                    addToast={addToast}
                    insuranceTypes={insuranceTypes}
                    insuranceFields={insuranceFields}
                    onUpdateInsuranceFields={onUpdateInsuranceFields}
                    isReadOnly={isReadOnly(editingPolicy)}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Policies</h3>
                        <Button onClick={handleAddNewPolicy} variant="primary"><Plus size={16}/> Add New Policy</Button>
                    </div>
                    
                    <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 -mr-2">
                        {displayPolicies.length > 0 ? (
                            displayPolicies.map(policy => (
                                <div key={policy.id}>
                                    <PolicyCard policy={policy} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                <FileSignature size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
                                <p className="mt-2 text-sm font-semibold">No Policies Found</p>
                                <p className="mt-1 text-xs">Click "Add New Policy" to get started.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Lightbulb /> AI Opportunities
                            </h3>
                            <Button onClick={handleFindUpsellClick} disabled={isFindingUpsell}>
                                {isFindingUpsell ? <Loader2 className="animate-spin" size={16} /> : <Lightbulb size={16} />}
                                {isFindingUpsell ? 'Searching...' : 'Find Upsell Opportunity'}
                            </Button>
                        </div>
                        {isFindingUpsell && (
                            <div className="text-center p-4 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /><p className="mt-2 text-sm">Gemini is analyzing the profile...</p></div>
                        )}
                        {localUpsellSuggestion && (
                             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg animate-fade-in">
                                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">Suggestion Found:</h4>
                                <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">
                                    {localUpsellSuggestion}
                                </p>
                            </div>
                        )}
                        {!isFindingUpsell && localUpsellSuggestion === null && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg animate-fade-in">
                               <p className="text-sm text-green-700 dark:text-green-300">
                                   No new specific upsell opportunities were found at this time.
                               </p>
                           </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
