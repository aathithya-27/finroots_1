import React from 'react';

// --- Advisor & User Types ---

export type AdvisorSpecialization = 'Life' | 'Health' | 'Motor' | 'Home' | 'Travel';

export interface AdvisorEducation {
  id: string;
  education: string;
  specialization: string;
  instituteName: string;
  university: string;
  fromDate: string;
  toDate: string;
  grade: string;
  totalMarks: number;
  marksObtained: number;
}

export interface AdvisorAddress {
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  phone1?: string;
  phone2?: string;
  faxNo?: string;
  email?: string;
}

export interface BankDetails {
    bankName?: string;
    accountNumber?: string;
    cifNumber?: string;
    ifscCode?: string;
    accountType?: 'Current Account' | 'Overdraft Account' | 'Cash Credit Account' | '';
}

export interface AdvisorDocument {
  id: string;
  documentName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

export interface AdvisorProfile {
  photoUrl?: string;
  employeeBranchId?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  dateOfCreation?: string;
  dateOfLeaving?: string;
  panNo?: string;
  aadhaarNo?: string;
  salary?: number;
  status: 'Active' | 'Inactive';
  attendance?: { [date: string]: 'Present' | 'Absent' };
  specializations?: AdvisorSpecialization[];
  maxCapacity?: number;
  branchName?: string;
  fatherMotherName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  workExperienceYears?: number;
  workExperienceMonths?: number;
  industry?: string;
  drivingLicenceObtained?: boolean;
  drivingLicenceNo?: string;
  dlExpiryDate?: string;
  computerSkills?: string;
  computerKnowledge?: { msOffice: boolean; programming: boolean; others: string; };
  permanentAddress?: AdvisorAddress;
  localAddress?: AdvisorAddress;
  educationDetails?: AdvisorEducation[];
  employeeGroup?: 'LI' | 'HI' | 'GI';
  companyId?: string;
  bankDetails?: BankDetails;
  documents?: AdvisorDocument[];
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  company: string;
  companyId: string;
  initials: string;
  password?: string;
  profile?: AdvisorProfile;
}


// --- Policy & Insurance Types ---

export type ConcretePolicyType = 'Health Insurance' | 'Life Insurance' | 'General Insurance';
export type PolicyType = ConcretePolicyType | '';
export type GeneralInsuranceType = 'Motor' | 'Home' | 'Travel' | 'Commercial' | 'Fire' | 'Marine' | 'Personal Accident' | 'Crop' | 'Liability' | 'Shopkeeper' | 'Miscellaneous' | string;

export interface Traveler { 
    id: string; 
    name: string; 
    age: number; 
    relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Other'; 
}

export interface MotorInsuranceData {
  vehicleRegNo?: string;
  make?: string;
  model?: string;
  variant?: string;
  manufacturingYear?: number;
  fuelType?: string;
  engineNo?: string;
  chassisNo?: string;
  previousPolicyDetails?: string;
  ownerName?: string;
  contactInfo?: string;
  registrationStateCity?: string;
  usageType?: string;
  ncb?: string;
  idv?: number;
}

export interface HomeInsuranceData {
  ownerName?: string;
  propertyAddress?: string;
  propertyType?: string;
  yearOfConstruction?: number;
  sumInsuredForStructure?: number;
  sumInsuredForContents?: number;
  securityFeatures?: string;
  occupancyType?: string;
  policyTenure?: string;
}

export interface TravelInsuranceData {
  travelerName?: string;
  dobOrAge?: string;
  passportNumber?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  destination?: string;
  purposeOfTravel?: string;
  sumInsured?: number;
  preExistingMedicalConditions?: string;
  nomineeDetails?: string;
  travelers?: Traveler[];
}

export interface CommercialInsuranceData {
    businessName?: string;
    businessType?: string;
    locationAddress?: string;
    propertyValue?: number;
    inventoryValue?: number;
    equipmentDetails?: string;
    annualTurnover?: number;
    numEmployees?: number;
    coverageType?: string;
}

export interface FireInsuranceData {
    policyholderName?: string;
    propertyAddress?: string;
    propertyType?: string;
    occupancyNature?: string;
    sumInsured?: number;
    constructionMaterial?: string;
    fireProtectionMeasures?: string;
    policyDuration?: string;
}

export interface MarineInsuranceData {
    shipperName?: string;
    cargoType?: string;
    transitMode?: string;
    ports?: string;
    invoiceValue?: number;
    goodsDescription?: string;
    transitPeriod?: string;
    packagingDetails?: string;
}

export interface PersonalAccidentInsuranceData {
    fullName?: string;
    dobOrAge?: string;
    occupation?: string;
    nomineeDetails?: string;
    sumInsured?: number;
    riskCategory?: string;
    medicalHistory?: string;
}

export interface CropInsuranceData {
    farmerId?: string;
    landDetails?: string;
    cropType?: string;
    sowingHarvestingDates?: string;
    location?: string;
    loanDetails?: string;
    bankAccountDetails?: string;
}

export interface LiabilityInsuranceData {
    insuredEntityName?: string;
    businessType?: string;
    annualRevenue?: number;
    riskNature?: string;
    coverageType?: string;
    numEmployees?: number;
    claimsHistory?: string;
    desiredSumInsured?: number;
}

export interface ShopkeeperInsuranceData {
    shopOwnerName?: string;
    shopAddress?: string;
    goodsType?: string;
    inventoryValue?: number;
    buildingValue?: number;
    numEmployees?: number;
    policyTerm?: string;
    safetyFeatures?: string;
}

export interface MiscellaneousInsuranceData {
    gadgetDetails?: string;
    petDetails?: string;
    cyberDetails?: string;
    eventDetails?: string;
}

export interface LICFamilyMember { 
    relation: 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Spouse' | 'Child'; 
    isAlive: boolean; 
    age?: number; 
    stateOfHealth?: string; 
    ageAtDeath?: number; 
    causeOfDeath?: string; 
}

export interface LICPreviousPolicy { 
    id: string; 
    policyNo: string; 
    sumAssured: number; 
    mode: string; 
    doc: string; 
    planAndTerm: string; 
}

export interface LICData {
    fatherName?: string;
    motherName?: string;
    spouseName?: string;
    placeOfBirth?: string;
    dob?: string;
    address?: string;
    mobile1?: string;
    mobile2?: string;
    email?: string;
    panCard?: string;
    aadhaar?: string;
    educationalQualification?: string;
    occupation?: string;
    presentOccupation?: string;
    annualIncome?: number;
    sourceOfIncome?: string;
    presentEmployerName?: string;
    lengthOfService?: string;
    policyPlanTerm?: string;
    policySumAssured?: number;
    previousPolicies?: LICPreviousPolicy[];
    height?: number;
    weight?: number;
    nomineeName?: string;
    nomineeRelationship?: string;
    nomineeDob?: string;
    identificationMark1?: string;
    identificationMark2?: string;
    hadSurgery?: boolean;
    surgeryDetails?: string;
    familyDetails?: LICFamilyMember[];
    husbandName?: string;
    husbandProfession?: string;
    husbandAnnualIncome?: number;
}

export interface HealthInsuranceData {
    // Proposer Details
    proposerPanNo?: string;
    proposerAadharNo?: string;
    proposerEmailId?: string;
    proposerPhoneNo?: string;

    // Bank Details
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;

    // Insured Details for Self/Individual
    height?: number;
    weight?: number;
    occupation?: string;
    annualIncome?: number;
    isGoodHealth?: boolean;
    fatherName?: string;
    motherName?: string;

    // Nominee Details
    nomineeName?: string;
    nomineeRelationship?: string;
    nomineeDob?: string;
    nomineeGender?: 'Male' | 'Female' | 'Other';
    
    // Medical History Questionnaire
    hadMedicalTreatment?: boolean;
    medicalTreatmentDetails?: string;
    hadSurgery?: boolean;
    surgeryDetails?: string;
    onMedication?: boolean;
    medicationDetails?: string;
    
    // Kept for backward compatibility if needed
    previousPolicies?: LICPreviousPolicy[];
}

export interface Policy {
  id:string;
  policyType: PolicyType;
  schemeName?: string;
  policyHolderType?: 'Individual' | 'Family';
  coveredMembers?: CoveredMember[];
  familyHeadMemberId?: string; 
  coverage: number;
  premium: number;
  renewalDate: string;
  status: 'Active' | 'Inactive';
  renewalLink?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Cheque' | 'NetBanking';
  paymentProofUrl?: string;
  paymentProofFilename?: string;
  paymentDetails?: { transactionId: string; amount: string; date: string; status: 'Verified' | 'Unverified' | 'Mismatch' | 'Error'; statusReason?: string; };
  commission?: { amount: number; status: 'Pending' | 'Paid' | 'Cancelled'; paidDate?: string; };
  documentReceived?: boolean;
  licData?: LICData;
  healthInsuranceData?: HealthInsuranceData;
  generalInsuranceType?: GeneralInsuranceType;
  generalInsuranceData?: MotorInsuranceData | HomeInsuranceData | TravelInsuranceData | CommercialInsuranceData | FireInsuranceData | MarineInsuranceData | PersonalAccidentInsuranceData | CropInsuranceData | LiabilityInsuranceData | ShopkeeperInsuranceData | MiscellaneousInsuranceData;
  premiumFrequency?: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  dynamicData?: Record<string, any>;
  companyId?: string;
  isLegacyFamilyPolicy?: boolean;
}


// --- Member & Customer Types ---

export interface CoveredMember {
    id: string;
    memberId?: string; 
    name: string;
    relationship: string;
    dob: string;
    gender?: 'Male' | 'Female' | 'Transgender' | 'Other';
    email?: string;
    mobile?: string;
    address?: string;
    height?: number;
    weight?: number;
    occupation?: string;
    annualIncome?: number;
    isGoodHealth?: boolean;
}

export interface SpecialOccasion { 
    id: string; 
    name: string; 
    date: string; 
}

export interface DigipinDetails {
    summary?: string;
    landmarks?: string[];
}

export interface FinancialProfile { 
    annualIncome?: number; 
    monthlyExpenses?: number; 
    riskTolerance?: 'Low' | 'Medium' | 'High'; 
    financialGoals?: string; 
}

export interface Member {
  id:string; 
  name: string; 
  memberId: string; 
  dob: string; 
  gender?: 'Male' | 'Female' | 'Transgender' | 'Other'; 
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'; 
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed'; 
  mobile: string; 
  email?: string; 
  state: string; 
  district?: string;
  city: string; 
  address: string; 
  memberType: 'Silver' | 'Gold' | 'Diamond' | 'Platinum'; 
  active: boolean; 
  panCard: string; 
  aadhaar: string; 
  photoUrl?: string; 
  addressProofUrl?: string; 
  anniversary?: string; 
  otherSpecialOccasions?: SpecialOccasion[]; 
  policies: Policy[]; 
  voiceNotes: VoiceNote[]; 
  documents: UploadedDocument[]; 
  lat?: number; 
  lng?: number; 
  digipin?: string; 
  digipinDetails?: DigipinDetails; 
  automatedGreetingsEnabled?: boolean; 
  inactiveSince?: string | null; 
  assignedTo: string[]; 
  leadSource?: LeadSource; 
  routeId?: string | null; 
  processStage: ProcessStage; 
  stageLastChanged?: string; 
  processHistory?: ProcessLog[]; 
  financialProfile?: FinancialProfile; 
  bankDetails?: BankDetails; 
  createdBy?: string; 
  createdAt?: string; 
  documentChecklist?: { [key: string]: boolean | string };
  company: string;
  companyId: string;
  branchId?: string;
  referrerId?: string;
  isReferrerOnly?: boolean;
  customerCategoryId?: string;
  customerSubCategoryId?: string;
  customerGroupId?: string;
  isSPOC?: boolean; 
  spocId?: string | null; 
  familyName?: string | null; 
  spocMemberId?: string; 
  spocMobile?: string; 
  relievedTimestamp?: string | null; 
}

export interface FamilyMemberNode { 
    id: string; 
    name: string; 
    memberId: string; 
    children: FamilyMemberNode[]; 
    isSPOC: boolean; 
    mobile?: string; 
    email?: string; 
}


// --- Lead, Pipeline & Process Types ---

export interface LeadSource { 
    sourceId: string | null; 
    detail?: string; 
}

export type ProcessStage = string;

export interface ProcessLog { 
    stage: ProcessStage; 
    timestamp: string; 
    remarks?: string; 
    skipped: boolean; 
}

export interface LeadActivityLog {
  timestamp: string;
  action: 'Created' | 'Status Change' | 'Details Updated' | 'Note Added';
  details: string;
  by: string; // User ID
}

export interface Lead { 
    id: string; 
    name: string; 
    email?: string; 
    phone: string; 
    leadSource?: LeadSource; 
    status: 'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent' | 'Won' | 'Lost'; 
    estimatedValue: number; 
    assignedTo: string; 
    createdAt: string; 
    lastUpdatedAt?: string; 
    activityLog?: LeadActivityLog[]; 
    notes?: string; 
    policyInterestType?: PolicyType; 
    policyInterestGeneralType?: GeneralInsuranceType; 
    company: string; 
    companyId: string; 
    branchId?: string; 
    followUpDate?: string; 
    voiceNotes?: VoiceNote[]; 
    upsellSuggestion?: string; 
    referrerId?: string; 
}

export type PipelineStatus = 'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent';


// --- Task, Activity & Notification Types ---

export interface VoiceNote { 
    id: string; 
    filename: string; 
    client: string; 
    recording_date: string; 
    detected_language: string; 
    summary: string; 
    tags: string[]; 
    status: string; 
    transcript_snippet: string; 
    audioUrl?: string; 
    actionItems?: string[]; 
    createdBy?: string; 
    assignedTo?: string; 
}

export interface UploadedDocument { 
    id:string; 
    documentType: string; 
    fileName: string; 
    fileUrl: string; 
    mimeType: string; 
    status?: 'Uploaded' | 'Sent for Signature' | 'Signed'; 
}

export interface ToastData { 
    id: number; 
    message: string; 
    type: 'success' | 'error'; 
}

export interface UpsellOpportunity { 
    id: string; 
    memberId: string; 
    memberName: string; 
    suggestions: string; 
    timestamp: string; 
}

export interface ActivityLog { 
    id: string; 
    type: 'renewalSuccess'; 
    message: string; 
    timestamp: string; 
    memberId: string; 
    policyId: string; 
}

export interface Appointment { 
    id: string; 
    memberName: string; 
    dateTime: string; 
    memberId: string; 
}

export interface TaskActivityLog {
  timestamp: string;
  action: 'Created' | 'Status Change' | 'Details Updated' | 'Reassigned';
  details: string;
  by: string; // User ID
}

export interface Task { 
  id: string; 
  triggeringPoint: string; 
  taskDescription: string; 
  expectedCompletionDateTime: string; 
  creationDateTime?: string; 
  isCompleted: boolean; 
  isShared?: boolean;
  primaryContactPerson?: string; 
  alternateContactPersons?: string[]; 
  memberId?: string;
  leadId?: string;
  subTaskId?: string; 
  statusId?: string; 
  taskType: 'Auto' | 'Manual'; 
  taskTime?: string; 
  active?: boolean;
  activityLog?: TaskActivityLog[];
}

export interface Notification {
  id: string;
  type: 'Birthday' | 'Anniversary' | 'Policy Renewal' | 'Premium Payment' | 'Custom' | 'Special Occasion' | 'Task Assignment';
  date: string; // ISO string
  message: string;
  occasionName?: string;
  member: {
    id: string;
    name: string;
    mobile: string;
  };
  policy?: {
    id: string;
    policyType: PolicyType;
    renewalLink?: string;
  };
  source: 'auto' | 'custom';
  dismissed?: boolean;
}


// --- App State & UI Types ---

export type Tab = 'dashboard' | 'reports & insights' | 'pipeline' | 'customers' | 'policies' | 'notes' | 'actionHub' | 'location' | 'chatbot' | 'profile' | 'advisors' | 'servicesHub' | 'masterMember' | 'taskManagement';

export enum ModalTab { 
    BasicInfo = 'Basic Info', 
    Documents = 'Documents', 
    Policies = 'Policies', 
    ProcessFlow = 'Process Flow', 
    Tasks = 'Tasks', 
    Family = 'Family', 
    NotesAndReminders = 'Notes & Special Dates', 
    NeedsAnalysis = 'Needs Analysis', 
    Notes = 'Notes' 
}

export enum AdvisorModalTab { 
    GeneralInfo = 'General Info', 
    Address = 'Address', 
    Education = 'Education Details', 
    Customers = 'Customers', 
    Documents = 'Documents' 
}

export type DashboardTaskTypeFilter = 'all' | 'personal' | 'customer' | 'shared';

export interface TodaysFocusItem { 
    id: string; 
    priority: 'High' | 'Medium' | 'Low'; 
    title: string; 
    rationale: string; 
    action: 'call' | 'review' | 'follow-up' | 'email' | 'task'; 
    relatedId: string; 
    relatedName: string; 
}


// --- Automation & Configuration ---

export interface AutomationRule { 
    id: number; 
    type: 'Birthday Messages' | 'Anniversary Messages' | 'Policy Renewal Messages' | 'Special Occasion Messages'; 
    timing: { value: number; unit: 'days' | 'weeks'; relation: 'before'; }; 
    enabled: boolean; 
    template: string; 
    channels: ('whatsapp' | 'sms' | 'email' | 'call')[]; 
    icon?: React.ReactElement; 
}

export interface CustomScheduledMessage { 
    id: string; 
    memberId: string; 
    dateTime: string; 
    message: string; 
}

export interface DocTemplate { 
    id: string; 
    name: string; 
    content: string; 
}

export type Role = 'Admin' | 'Advisor' | 'Support';
export type AppModule = 'dashboard' | 'reports & insights' | 'advisors' | 'pipeline' | 'customers' | 'taskManagement' | 'policies' | 'notes' | 'actionHub' | 'servicesHub' | 'location' | 'chatbot' | 'masterMember';

export interface RolePermissions {
  role: Role;
  permissions: {
    [key in AppModule]?: boolean;
  };
}


// --- Miscellaneous Types ---

export interface Gift { 
    id: string; 
    name: string; 
    active?: boolean; 
}

export interface GiftMapping { 
    tier: Member['memberType']; 
    giftId: string | null; 
}

export interface MutualFundScheme { 
    id: string; 
    name: string; 
    category: string; 
    nav: number; 
}

export interface MutualFundHolding { 
    schemeId: string; 
    units: number; 
    purchaseDate: string; 
}

export interface AgentAppointment { 
    id: string; 
    date: string; 
    time: string; 
    purpose: string; 
    status: 'Scheduled' | 'Completed' | 'Cancelled'; 
}


// --- Master Data Management ---

export interface FinRootsCompanyInfo {
    name: string;
    hq: string;
    cin: string;
    incorporationDate: string;
}

export interface Company {
    id: string;
    companyCode: string;
    name: string;
    mailingName?: string;
    dateOfCreation?: string;
    active?: boolean;
    address?: {
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        state?: string;
        pinCode?: string;
    };
    contact?: {
        phoneNo?: string;
        faxNo?: string;
        emailId?: string;
    };
    gstin?: string;
    pan?: string;
    tan?: string;
    applicableForBooking?: boolean;
    applicableForJobCard?: boolean;
    applicableForSaleOrder?: boolean;
    defaultForBooking?: boolean;
    defaultForHP?: boolean;
    defaultForExchange?: boolean;
    defaultForJobCard?: boolean;
    defaultForSparesPurchaseOrder?: boolean;
    defaultForVehiclePurchaseOrder?: boolean;
}

export interface BranchCompanyMapping {
    id: string; 
    companyId: string;
    companyName?: string;
    mappingStatus: boolean;
    finYrClosureAllowed: boolean;
}

export interface FinRootsBranch { 
    id: string;
    branchId: string; 
    branchName: string; 
    companyId: string;
    active?: boolean; 
    defaultForSync?: boolean;
    dateOfCreation?: string;
    gstin?: string;
    pan?: string;
    tan?: string;
    address?: {
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        phone?: string;
        fax?: string;
    };
    altAddress?: {
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        phone?: string;
        fax?: string;
    };
    features?: {
        expService?: boolean;
        pickAndDrop?: boolean;
        expertOnWheels?: boolean;
        mileageTesting?: boolean;
    };
    companyMappings?: BranchCompanyMapping[];
    contactPerson?: string;
    phone?: string;
    email?: string;
}

export interface BankMaster {
    id: string;
    bankCode: string;
    bankName: string;
    branchName: string;
    acGroupCode?: string;
    glCode?: string;
    glDescription?: string;
    paymentTerm?: string;
    dateOfCreation?: string;
    active: boolean;
    line1?: string;
    line2?: string;
    line3?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    phone1?: string;
    phone2?: string;
    faxNo?: string;
    contactPerson?: string;
    emailId?: string;
    landmark?: string;
    accountType: 'Current Account' | 'Overdraft Account' | 'Cash Credit Account' | '';
    accountNumber: string;
    ifscCode?: string;
    creditLimit?: number;
    authSign1?: string;
    authSign2?: string;
    order?: number;
}


// --- Master Data - Dropdowns & Mappings ---

export interface BusinessVertical { id: string; name: string; active?: boolean; order?: number; }
export interface LeadSourceMaster { id: string; name: string; parentId: string | null; active?: boolean; order?: number; }
export type ReferralType = LeadSourceMaster;
export interface SchemeMaster { id: string; name: string; type: ConcretePolicyType; companyId: string; generalInsuranceType?: GeneralInsuranceType; active?: boolean; order?: number; }
export interface Geography { id: string; name: string; type: 'Country' | 'State' | 'District' | 'City' | 'Pincode' | 'Area'; parentId: string | null; active?: boolean; }
export interface Agency { id: string; name: string; }
export interface TaskStatusMaster { id: string; name: string; active?: boolean; order?: number; }
export interface GiftMaster { id: string; name: string; active?: boolean; order?: number; }
export interface RelationshipType { id: string; name: string; active?: boolean; }
export interface DocumentMaster { id: string; name: string; active?: boolean; order?: number; }
export interface SchemeDocumentMapping { schemeId: string; documentId: string; }
export interface CustomerCategory { id: string; name: string; active?: boolean; order?: number; }
export interface CustomerSubCategory { id: string; name: string; parentId: string; active?: boolean; order?: number; }
export interface CustomerGroup { id: string; name: string; active?: boolean; order?: number; }
export interface FinYear { id: string; name: string; startDate: string; endDate: string; }
export interface TaskMaster { id: string; name: string; active?: boolean; order?: number; }
export interface SubTaskMaster { id: string; name: string; taskMasterId: string; active?: boolean; order?: number; }
export interface PolicyChecklistMaster { id: string; name: string; parentId: string | null; policyType: string; active?: boolean; order?: number; }
export interface Route { id: string; name: string; active?: boolean; order?: number; }

export interface InsuranceTypeMaster {
    id: string;
    name: string;
    verticalId: string;
    active?: boolean;
    order?: number;
}

export interface InsuranceFieldMaster {
    id: string;
    insuranceTypeId: string;
    fieldName: string;
    label: string;
    fieldType: 'text' | 'number' | 'date';
    order: number;
    active?: boolean;
}
