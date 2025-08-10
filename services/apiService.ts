import { Member, Policy, PolicyType, Lead, User, Route, ProcessStage, AdvisorProfile, Company, FinRootsBranch, RolePermissions } from '../types.ts';

// --- NEW: MOCK DATA FOR ROLE PERMISSIONS ---
let rolePermissionsData: RolePermissions[] = [
    {
        role: 'Advisor',
        permissions: {
            dashboard: true,
            'reports & insights': true,
            advisors: false, // Advisors shouldn't manage other advisors
            pipeline: true,
            customers: true,
            taskManagement: true,
            policies: true,
            notes: true,
            actionHub: true,
            servicesHub: true,
            location: true,
            chatbot: true,
            masterMember: false, // Advisors shouldn't access master data
        }
    },
    // Admin and Support roles have all permissions by default and are not dynamically managed in this scope.
];


// --- UNIFIED DATA SOURCE FOR BRANCHES ---
// This is now the single source of truth for all branches in the application.
const finrootsBranchesData: FinRootsBranch[] = [
    // Finroots Branches
    { id: 'frb-1', branchName: 'Erode HQ', branchId: 'FIN01-ERD', companyMappings: [], active: true, companyId: 'FIN01', gstin: '33ABCDE1234F1Z5', pan: 'ABCDE1234F', tan: 'ERDF12345G' },
    { id: 'frb-2', branchName: 'Coimbatore Hub', branchId: 'FIN01-CBE', companyMappings: [], active: true, companyId: 'FIN01', gstin: '33ABCDE1234F1Z6', pan: 'ABCDE1234F', tan: 'CBEF12345G' },
    // Autonova Solutions Branches
    { id: 'frb-3', branchName: 'Mumbai Central', branchId: 'AUTO01-MUM', companyMappings: [], active: true, companyId: 'AUTO01', gstin: '27FGHIJ5678K1Z9', pan: 'FGHIJ5678K', tan: 'MUMF98765B' },
    { id: 'frb-4', branchName: 'Pune West', branchId: 'AUTO01-PUN', companyMappings: [], active: true, companyId: 'AUTO01', gstin: '27FGHIJ5678K2Z0', pan: 'FGHIJ5678K', tan: 'PUNF98765B' }
];


// Mock Data for Companies
let companies: Company[] = [
    {
        id: 'FIN01',
        companyCode: 'FIN01',
        name: 'Finroots',
        mailingName: 'Finroots Financial Services Pvt. Ltd.',
        dateOfCreation: '2020-01-01',
        active: true,
        address: {
            line1: '123 Financial Street',
            line2: 'Bandstand',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400050'
        },
        contact: {
            phoneNo: '+91 22 12345678',
            emailId: 'info@finroots.com'
        },
        gstin: '27ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        tan: 'MUMF12345G'
    },
    {
        id: 'AUTO01',
        companyCode: 'AUTO01',
        name: 'Autonova Solutions',
        mailingName: 'Autonova Solutions Inc.',
        dateOfCreation: '2018-05-10',
        active: true,
        address: {
            line1: '456 Tech Park',
            line2: 'Electronic City',
            city: 'Bengaluru',
            state: 'Karnataka',
            pinCode: '560100'
        },
        contact: {
            phoneNo: '+91 80 98765432',
            emailId: 'contact@autonova.com'
        },
        gstin: '29FGHIJ5678K1Z9',
        pan: 'FGHIJ5678K',
        tan: 'BLRA98765B'
    }
];

let users: User[] = [
    // Finroots Users
    {
        id: 'user-1',
        employeeId: 'admin',
        name: 'Admin User',
        email: 'admin@finroots.com',
        role: 'Admin',
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'AU',
        password: 'admin',
        profile: { status: 'Active', companyId: 'FIN01' }
    },
    {
        id: 'user-2',
        employeeId: '1002',
        name: 'Rohan Patel',
        email: 'rohan.p@finroots.com',
        role: 'Advisor',
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'RP',
        password: 'password',
        profile: {
            status: 'Active',
            specializations: [],
            maxCapacity: undefined, // Represents '∞'
            companyId: 'FIN01',
            employeeBranchId: 'frb-1' // Erode HQ
        }
    },
    {
        id: 'user-3',
        employeeId: '1003',
        name: 'Priya Singh',
        email: 'priya.s@finroots.com',
        role: 'Advisor',
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'PS',
        password: 'password',
        profile: {
            status: 'Active',
            specializations: ['Life'],
            maxCapacity: 50,
            companyId: 'FIN01',
            employeeBranchId: 'frb-2' // Coimbatore Hub
        }
    },
    {
        id: 'user-7',
        employeeId: '1004',
        name: 'Amit Sharma',
        email: 'amit.s@finroots.com',
        role: 'Advisor',
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'AS',
        password: 'password',
        profile: {
            status: 'Active',
            specializations: ['Health'],
            maxCapacity: 40,
            companyId: 'FIN01',
            employeeBranchId: 'frb-1' // Erode HQ
        }
    },
    {
        id: 'user-8',
        employeeId: 'Support',
        name: 'Finroots Support',
        email: 'support@finroots.com',
        role: 'Support',
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'FS',
        password: 'Support',
        profile: { status: 'Active', companyId: 'FIN01' }
    },
    // Autonova Solutions Users
    {
        id: 'user-4',
        employeeId: 'admin',
        name: 'Autonova Admin',
        email: 'admin@autonova.com',
        role: 'Admin',
        company: 'Autonova Solutions',
        companyId: 'AUTO01',
        initials: 'AA',
        password: 'autonova123',
        profile: { status: 'Active', companyId: 'AUTO01' }
    },
    {
        id: 'user-5',
        employeeId: '2002',
        name: 'Autonova Advisor 1',
        email: 'advisor1@autonova.com',
        role: 'Advisor',
        company: 'Autonova Solutions',
        companyId: 'AUTO01',
        initials: 'A1',
        password: 'password',
        profile: { status: 'Active', companyId: 'AUTO01', employeeBranchId: 'frb-3' } // Mumbai Central
    },
    {
        id: 'user-11',
        employeeId: '1002',
        name: 'Sanjay Rao',
        email: 'sanjay.r@autonova.com',
        role: 'Advisor',
        company: 'Autonova Solutions',
        companyId: 'AUTO01',
        initials: 'SR',
        password: 'password',
        profile: { status: 'Active', companyId: 'AUTO01', employeeBranchId: 'frb-4' } // Pune West
    },
    {
        id: 'user-9',
        employeeId: '2003',
        name: 'Autonova Advisor 2',
        email: 'advisor2@autonova.com',
        role: 'Advisor',
        company: 'Autonova Solutions',
        companyId: 'AUTO01',
        initials: 'A2',
        password: 'password',
        profile: { status: 'Active', companyId: 'AUTO01', employeeBranchId: 'frb-3' } // Mumbai Central
    },
    {
        id: 'user-10',
        employeeId: '2004',
        name: 'Autonova Advisor 3',
        email: 'advisor3@autonova.com',
        role: 'Advisor',
        company: 'Autonova Solutions',
        companyId: 'AUTO01',
        initials: 'A3',
        password: 'password',
        profile: { status: 'Active', companyId: 'AUTO01', employeeBranchId: 'frb-4' } // Pune West
        
    },
    {
        id: 'user-6',
        employeeId: 'help',
        name: 'Autonova Support',
        email: 'support@autonova.com',
        role: 'Support',
        company: 'Autonova Solutions',
        companyId: 'AUTO01',
        initials: 'AS',
        password: 'help@123',
        profile: { status: 'Active', companyId: 'AUTO01' }
    }
];

let routes: Route[] = [
    { id: 'route-1', name: 'Erode Route', active: true, order: 0 },
    { id: 'route-2', name: 'Coimbatore Route', active: true, order: 1 },
    { id: 'route-3', name: 'Salem Route', active: true, order: 2 },
    { id: 'route-4', name: 'Chennai Route', active: true, order: 3 },
];

// Premium Calculation Logic
export const calculatePremium = (policyType: PolicyType, coverage: number): number => {
    switch (policyType) {
        case 'Health Insurance':
            return Math.round(5000 + (coverage * 0.002));
        case 'Life Insurance':
            return Math.round(2000 + (coverage * 0.001));
        case 'General Insurance':
            return Math.round(1000 + (coverage * 0.02));
        default:
            return 0;
    }
};

// Member Tier Calculation Logic
const calculateMemberTier = (member: Member): Member => {
    const policies = member.policies || [];
    const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);
    let newMemberType: Member['memberType'] = 'Silver';
    if (totalPremium > 50000) {
        newMemberType = 'Platinum';
    } else if (totalPremium > 30000) {
        newMemberType = 'Diamond';
    } else if (totalPremium > 15000) {
        newMemberType = 'Gold';
    }
    return { ...member, memberType: newMemberType };
};

// --- DIGIPIN GENERATION ---
// This is exported so the simulated geminiService can use it.
export const generateDigipin = (lat: number, lng: number): string => {
    const CCODE = "23456789CFGHJMPQRVWX";
    let lat_val = Math.round((lat + 90) * 8000 * 20);
    let lng_val = Math.round((lng + 180) * 8000 * 20);

    let code = "";
    for (let i = 0; i < 5; i++) {
        let lat_digit = lat_val % 20;
        let lng_digit = lng_val % 20;
        lat_val = Math.floor(lat_val / 20);
        lng_val = Math.floor(lng_val / 20);
        code = CCODE[lat_digit] + CCODE[lng_digit] + code;
        if (i === 0) code = '+' + code;
        if (i === 1) code = ' ' + code;
    }
    
    // Replace space with '+' as per standard Plus Code format
    return code.replace(' ', '+').slice(0, 11); // e.g., 7J4VPQCP+HG
};


// --- DYNAMIC DATE GENERATION FOR DEMO ---
const today = new Date();
const priyaDob = new Date(today);
priyaDob.setFullYear(1985);
const kavyaAnniversary = new Date(today);
kavyaAnniversary.setFullYear(2005);
const vikramRenewal = new Date(today);
vikramRenewal.setDate(today.getDate() + 7);
const deepaRenewal = new Date(today);
deepaRenewal.setDate(today.getDate() + 25);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

// In-memory database simulation
let members: Member[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    memberId: 'PR1043312',
    dob: formatDate(priyaDob), // Dynamic Birthday
    gender: 'Female',
    bloodGroup: 'O+',
    maritalStatus: 'Married',
    mobile: '+91 9876543312',
    state: 'Maharashtra',
    city: 'Mumbai City',
    address: '101, Thirupathi Valley, Goregaon East',
    memberType: 'Gold',
    active: true,
    panCard: 'ABCDE1234F',
    aadhaar: '1234 5678 9012',
    anniversary: '2010-04-20',
    policies: [{ 
        id: 'POL001', 
        policyType: 'Life Insurance', 
        status: 'Active', 
        coverage: 23000000, 
        premium: 25000, 
        renewalDate: '2024-08-13', 
        renewalLink: 'https://example.com/renew/life', 
        commission: { amount: 2500, status: 'Paid', paidDate: '2024-06-15' }, 
        documentReceived: false,
        licData: {
            fatherName: 'Rajesh Sharma'
        },
        companyId: 'FIN01'
    }],
    voiceNotes: [],
    documents: [],
    digipin: '7JFJ3Q6H+2V', // Mumbai
    digipinDetails: {
        summary: 'A bustling residential area in Goregaon East.',
        landmarks: ['Oberoi Mall', 'Goregaon Station', 'Film City'],
    },
    automatedGreetingsEnabled: true,
    inactiveSince: null,
    assignedTo: ['user-2'], // Rohan Patel
    leadSource: { sourceId: 'rt-3', detail: 'Arjun Mehta' },
    processStage: 'Premium Collection',
    stageLastChanged: '2024-07-10T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-1',
    createdAt: '2024-01-10T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Finroots',
    companyId: 'FIN01',
    isSPOC: true,
    familyName: 'The Sharmas'
  },
  {
    id: '9', // New member for family tree
    name: 'Rohan Sharma',
    memberId: 'RO9876543',
    dob: '2012-09-10',
    gender: 'Male',
    maritalStatus: 'Single',
    mobile: '+91 9876543313',
    state: 'Maharashtra',
    city: 'Mumbai City',
    address: '101, Thirupathi Valley, Goregaon East',
    memberType: 'Silver',
    active: true,
    panCard: '',
    aadhaar: '',
    policies: [],
    voiceNotes: [],
    documents: [],
    digipin: '7JFJ3Q6H+3X', // Mumbai, slightly offset
    assignedTo: ['user-2'],
    isSPOC: false,
    spocId: 'PR1043312', // Linked to Priya Sharma
    familyName: 'The Sharmas',
    company: 'Finroots',
    companyId: 'FIN01',
    processStage: 'Initial Contact',
    leadSource: { sourceId: null }
  },
  {
    id: '2',
    name: 'Deepa Verma',
    memberId: 'DEA286543',
    dob: '1990-11-12',
    gender: 'Female',
    bloodGroup: 'A+',
    maritalStatus: 'Single',
    mobile: '+91 9043386543',
    state: 'Delhi',
    city: 'New Delhi',
    address: 'A-23, Mullai Nagar, Connaught Place',
    memberType: 'Silver',
    active: true,
    panCard: 'FGHIJ5678K',
    aadhaar: '2345 6789 0123',
    policies: [{ id: 'POL002', policyType: 'Health Insurance', status: 'Active', coverage: 5000000, premium: 15000, renewalDate: formatDate(deepaRenewal), renewalLink: 'https://example.com/renew/health', commission: { amount: 1500, status: 'Paid', paidDate: '2024-05-25' }, documentReceived: false, companyId: 'FIN01' }],
    voiceNotes: [],
    documents: [],
    lat: 28.6315, // Legacy data for backward compatibility
    lng: 77.2167,
    automatedGreetingsEnabled: false,
    inactiveSince: null,
    assignedTo: ['user-3'], // Priya Singh
    leadSource: { sourceId: 'ls-3' },
    processStage: 'Policy Entry',
    stageLastChanged: '2024-07-15T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-2',
    createdAt: '2024-02-15T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Finroots',
    companyId: 'FIN01',
  },
  {
    id: '3',
    name: 'Kavya Reddy',
    memberId: 'KA5446573',
    dob: '1982-03-30',
    gender: 'Female',
    bloodGroup: 'B-',
    maritalStatus: 'Married',
    mobile: '+91 9675346573',
    state: 'Karnataka',
    city: 'Bengaluru (Bangalore) Urban',
    address: '54, TVS Road, HSR Layout',
    memberType: 'Silver',
    active: true,
    panCard: 'KLMNO9012L',
    aadhaar: '3456 7890 1234',
    anniversary: formatDate(kavyaAnniversary), // Dynamic Anniversary
    policies: [
        { id: 'POL003', policyType: 'General Insurance', generalInsuranceType: 'Motor', status: 'Active', coverage: 350000, premium: 8000, renewalDate: '2024-04-10', commission: { amount: 400, status: 'Paid', paidDate: '2024-04-12' }, documentReceived: true, companyId: 'FIN01' },
    ],
    voiceNotes: [],
    documents: [],
    lat: 12.9121,
    lng: 77.6389,
    automatedGreetingsEnabled: true,
    inactiveSince: null,
    assignedTo: ['user-3'], // Priya Singh
    leadSource: { sourceId: 'ls-8' },
    processStage: 'Policy Document Received',
    stageLastChanged: '2024-06-20T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-2',
    createdAt: '2024-03-20T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Finroots',
    companyId: 'FIN01',
  },
  {
    id: '4',
    name: 'Ramya Iyer',
    memberId: 'RA3483536',
    dob: '1995-08-25',
    gender: 'Female',
    bloodGroup: 'AB+',
    maritalStatus: 'Single',
    mobile: '+91 8736283536',
    state: 'Tamil Nadu',
    city: 'Chennai',
    address: '3/45, Ram Nagar, Nungambakkam',
    memberType: 'Silver',
    active: false,
    inactiveSince: '2024-03-15T10:00:00.000Z',
    panCard: 'PQRST3456M',
    aadhaar: '4567 8901 2345',
    anniversary: '2025-08-18',
    policies: [{id: 'POL004', policyType: 'Life Insurance', status: 'Inactive', coverage: 10000000, premium: 12000, renewalDate: '2024-03-30', commission: { amount: 1000, status: 'Cancelled' }, documentReceived: false, companyId: 'FIN01'}],
    voiceNotes: [],
    documents: [],
    digipin: '7M52376V+5R', // Chennai
    automatedGreetingsEnabled: false,
    assignedTo: [], 
    leadSource: { sourceId: 'ls-4' },
    processStage: 'Initial Contact',
    stageLastChanged: '2024-02-01T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-1',
    createdAt: '2024-04-01T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Finroots',
    companyId: 'FIN01',
  },
    {
    id: '5',
    name: 'Vikram Singh',
    memberId: 'VI7B56789',
    dob: '1978-01-15',
    gender: 'Male',
    bloodGroup: 'O-',
    maritalStatus: 'Married',
    mobile: '+91 9123456789',
    state: 'Maharashtra',
    city: 'Pune',
    address: '7B, Clover Park, Viman Nagar',
    memberType: 'Gold',
    active: true,
    panCard: 'UVXYZ9876A',
    aadhaar: '9876 5432 1098',
    policies: [{ id: 'POL005', policyType: 'Health Insurance', status: 'Active', coverage: 6500000, premium: 18000, renewalDate: formatDate(vikramRenewal), documentReceived: true, commission: { amount: 1800, status: 'Paid', paidDate: '2024-02-06' }, companyId: 'FIN01' }],
    voiceNotes: [],
    documents: [],
    lat: 18.5679,
    lng: 73.9143,
    automatedGreetingsEnabled: true,
    inactiveSince: null,
    assignedTo: ['user-2'], // Rohan Patel
    leadSource: { sourceId: 'ls-5' },
    processStage: 'Policy Handed Over',
    stageLastChanged: '2024-05-15T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-2',
    createdAt: '2024-05-15T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Finroots',
    companyId: 'FIN01',
  },
   {
    id: '6',
    name: 'Arjun Mehta',
    memberId: 'AR1176655',
    dob: '1992-07-22',
    gender: 'Male',
    bloodGroup: 'A-',
    maritalStatus: 'Single',
    mobile: '+91 9988776655',
    state: 'Karnataka',
    city: 'Bengaluru (Bangalore) Urban',
    address: '112, 4th Cross, Indiranagar',
    memberType: 'Platinum',
    active: true,
    panCard: 'BCDEF2345G',
    aadhaar: '8765 4321 0987',
    policies: [
        { id: 'POL006', policyType: 'Health Insurance', status: 'Active', coverage: 8500000, premium: 22000, renewalDate: '2025-01-20', commission: { amount: 2000, status: 'Paid', paidDate: '2024-01-22' }, documentReceived: true, companyId: 'FIN01' },
        { id: 'POL007', policyType: 'Life Insurance', status: 'Active', coverage: 28000000, premium: 30000, renewalDate: '2025-01-20', commission: { amount: 3000, status: 'Paid', paidDate: '2024-01-22' }, documentReceived: true, companyId: 'FIN01' }
    ],
    voiceNotes: [],
    documents: [],
    lat: 12.9784,
    lng: 77.6408,
    automatedGreetingsEnabled: true,
    inactiveSince: null,
    assignedTo: ['user-2', 'user-3'], // Rohan & Priya
    leadSource: { sourceId: 'ls-7' },
    processStage: 'Premium Reminders',
    stageLastChanged: '2024-07-22T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-2',
    createdAt: '2024-07-22T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Finroots',
    companyId: 'FIN01',
  },
  {
    id: '7',
    name: 'Anjali Sharma',
    memberId: 'ANJ001',
    dob: '1990-01-01',
    gender: 'Female',
    bloodGroup: 'A+',
    maritalStatus: 'Single',
    mobile: '+91 9876511111',
    state: 'Maharashtra',
    city: 'Pune',
    address: '123, ABC Road, Pune',
    memberType: 'Silver',
    active: true,
    panCard: 'ABCDE1234G',
    aadhaar: '1111 2222 3333',
    policies: [{ id: 'POL008', policyType: 'General Insurance', generalInsuranceType: 'Motor', status: 'Active', coverage: 500000, premium: 10000, renewalDate: '2025-03-15', documentReceived: true, companyId: 'AUTO01' }],
    voiceNotes: [],
    documents: [],
    digipin: '7J7JGVCC+5R', // Pune
    automatedGreetingsEnabled: true,
    inactiveSince: null,
    assignedTo: ['user-5'],
    leadSource: { sourceId: 'ls-8' },
    processStage: 'Initial Contact',
    stageLastChanged: '2024-07-01T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-4',
    createdAt: '2024-07-01T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Autonova Solutions',
    companyId: 'AUTO01',
  },
  {
    id: '8',
    name: 'Rajesh Kumar',
    memberId: 'RAJ002',
    dob: '1980-02-02',
    gender: 'Male',
    bloodGroup: 'B-',
    maritalStatus: 'Married',
    mobile: '+91 9876522222',
    state: 'Karnataka',
    city: 'Bengaluru (Bangalore) Urban',
    address: '456, XYZ Street, Bangalore',
    memberType: 'Gold',
    active: true,
    panCard: 'FGHIJ5678L',
    aadhaar: '4444 5555 6666',
    policies: [{ id: 'POL009', policyType: 'Health Insurance', status: 'Active', coverage: 7000000, premium: 20000, renewalDate: '2025-06-20', documentReceived: true, companyId: 'AUTO01' }],
    voiceNotes: [],
    documents: [],
    digipin: '7J4RXJJ4+M8', // Bengaluru
    automatedGreetingsEnabled: true,
    inactiveSince: null,
    assignedTo: ['user-5'],
    leadSource: { sourceId: 'ls-11' },
    processStage: 'Policy Entry',
    stageLastChanged: '2024-07-05T10:00:00.000Z',
    processHistory: [],
    createdBy: 'user-4',
    createdAt: '2024-07-05T10:00:00.000Z',
    financialProfile: {},
    bankDetails: {},
    company: 'Autonova Solutions',
    companyId: 'AUTO01',
  },
];

let leads: Lead[] = [
    { id: 'lead-1', name: 'Ravi Kumar', phone: '9876512345', email: 'ravi.k@example.com', leadSource: { sourceId: 'ls-8' }, status: 'Lead', estimatedValue: 15000, assignedTo: 'user-2', createdAt: '2024-07-20T10:00:00Z', notes: 'Interested in a family health plan.', company: 'Finroots', companyId: 'FIN01' },
    { id: 'lead-2', name: 'Sunita Nair', phone: '9123456780', email: 'sunita.n@example.com', leadSource: { sourceId: 'rt-2', detail: 'Priya Sharma' }, status: 'Contacted', estimatedValue: 25000, assignedTo: 'user-2', createdAt: '2024-07-18T14:30:00Z', notes: 'Referred by Priya Sharma. Follow up next week.', company: 'Finroots', companyId: 'FIN01' },
    { id: 'lead-3', name: 'Amit Desai', phone: '9988776650', email: 'amit.d@example.com', leadSource: { sourceId: 'ls-4' }, status: 'Meeting Scheduled', estimatedValue: 50000, assignedTo: 'user-2', createdAt: '2024-07-15T11:00:00Z', notes: 'Meeting on Friday at 3 PM to discuss life insurance options.', company: 'Finroots', companyId: 'FIN01' },
    { id: 'lead-4', name: 'Meera Gupta', phone: '9000011111', email: 'meera.g@example.com', leadSource: { sourceId: 'ls-9' }, status: 'Proposal Sent', estimatedValue: 12000, assignedTo: 'user-2', createdAt: '2024-07-12T09:00:00Z', notes: 'Sent proposal for vehicle insurance. Awaiting response.', company: 'Finroots', companyId: 'FIN01' },
];

// Mock database for the auto-fill feature
const preRegisteredUsers: Record<string, Partial<Member>> = {
    '9999988888': {
        name: 'Suresh Kumar',
        state: 'Delhi',
        city: 'New Delhi',
        address: '123, Sector 5, Dwarka'
    },
    '7777766666': {
        name: 'Anjali Verma',
        state: 'Gujarat',
        city: 'Ahmedabad',
        address: 'A-404, Satellite Towers'
    }
};

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'Mumbai City': { lat: 19.0760, lng: 72.8777 },
    'New Delhi': { lat: 28.7041, lng: 77.1025 },
    'Bengaluru (Bangalore) Urban': { lat: 12.9716, lng: 77.5946 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};


const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const login = async (company: string, employeeId: string, password_param: string, role: string, branchId?: string): Promise<User | null> => {
    await simulateDelay(200);
    
    // SECURITY NOTE: Storing and comparing plain-text passwords is a significant security risk.
    // This has been reverted per user request for admin visibility.
    // In a production environment, passwords should always be securely hashed.
    const user = users.find(u =>
        u.company === company &&
        u.employeeId.toLowerCase() === employeeId.toLowerCase() &&
        u.password === password_param && // Reverted from hashed comparison
        u.role === role
    );

    if (user && role !== 'Admin') {
        const companyBranches = finrootsBranchesData.filter(b => b.companyId === user.companyId);
        if (companyBranches.length > 0 && user.profile?.employeeBranchId !== branchId) {
            return null; // Branch mismatch for non-admin users
        }
    }

    return user ? JSON.parse(JSON.stringify(user)) : null;
};

export const getUsers = async (companyId?: string): Promise<User[]> => {
  await simulateDelay(100);
  const filteredUsers = companyId ? users.filter(u => u.companyId === companyId) : users;
  return JSON.parse(JSON.stringify(filteredUsers));
};

export const createAdvisor = async (advisorData: Omit<User, 'id' | 'role' | 'initials'>): Promise<User> => {
    await simulateDelay(300);
    const initials = (advisorData.name || '').split(' ').map(n => n[0]).join('').toUpperCase();
    
    // SECURITY NOTE: Reverting password hashing per user request.
    // Passwords will be stored in plain text. This is not recommended for production.
    const passwordToStore = advisorData.password || 'password'; // Reverted to plain text

    const newAdvisor: User = {
        ...advisorData,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'Advisor',
        initials,
        password: passwordToStore, // Using plain text password
        profile: { status: advisorData.profile?.status || 'Active', ...advisorData.profile, companyId: advisorData.companyId } // Ensure companyId and status are set in profile
    };
    users.push(newAdvisor);
    return JSON.parse(JSON.stringify(newAdvisor));
};

export const updateAdvisor = async (advisorData: User): Promise<User> => {
    await simulateDelay(300);
    const index = users.findIndex(u => u.id === advisorData.id);
    if (index === -1) {
        throw new Error('Advisor not found');
    }

    // SECURITY NOTE: Reverting password hashing per user request.
    // Passwords will be stored in plain text. This is not recommended for production.
    let dataToUpdate = { ...advisorData };
    if (dataToUpdate.password) {
       // The password is intentionally kept as plain text for admin visibility.
       // No hashing is performed here, ensuring the provided password is what gets stored.
    }

    const initials = (dataToUpdate.name || '').split(' ').map(n => n[0]).join('').toUpperCase();
    users[index] = { ...users[index], ...dataToUpdate, initials };
    return JSON.parse(JSON.stringify(users[index]));
};

export const deleteAdvisor = async (userId: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length === initialLength) {
        throw new Error('Advisor not found');
    }
    return { success: true };
};


export const getMembers = async (companyId?: string, advisorId?: string): Promise<Member[]> => {
  await simulateDelay(500);
  let filteredMembers = companyId ? members.filter(m => m.companyId === companyId) : members;

  if (advisorId) {
      // "My Customers" logic: created by the advisor or assigned to them
      filteredMembers = filteredMembers.filter(m => 
          m.createdBy === advisorId || (m.assignedTo && m.assignedTo.includes(advisorId))
      );
  }
  return JSON.parse(JSON.stringify(filteredMembers)); // Return a deep copy
};

export const createMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
  await simulateDelay(300);
  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  let newMember: Member = { 
    ...memberData, 
    id: newId, 
    inactiveSince: memberData.inactiveSince === undefined ? null : memberData.inactiveSince,
    policies: memberData.policies || [],
    voiceNotes: memberData.voiceNotes || [], 
    documents: memberData.documents || [],
    assignedTo: memberData.assignedTo || [],
    processStage: memberData.processStage || 'Initial Contact',
    stageLastChanged: memberData.stageLastChanged || new Date().toISOString(),
    companyId: memberData.companyId, // Ensure companyId is set for new members
  };
  
  // If lat/lng are provided but no Digipin, generate one.
  if ((newMember.lat && newMember.lng) && !newMember.digipin) {
    newMember.digipin = generateDigipin(newMember.lat, newMember.lng);
  }
  
  newMember = calculateMemberTier(newMember);
  members.push(newMember);
  return JSON.parse(JSON.stringify(newMember));
};

export const updateMember = async (memberData: Member): Promise<Member> => {
  await simulateDelay(300);
  const index = members.findIndex(m => m.id === memberData.id);
  if (index === -1) {
    throw new Error('Member not found');
  }
  
  const oldMember = members[index];
  let memberToUpdate = { ...oldMember, ...memberData };

  // If lat/lng are present but Digipin is not, generate one (handles legacy data conversion on first edit)
  if ((memberToUpdate.lat && memberToUpdate.lng) && !memberToUpdate.digipin) {
      memberToUpdate.digipin = generateDigipin(memberToUpdate.lat, memberToUpdate.lng);
  }

  // Handle inactiveSince date
  if (oldMember.active && !memberToUpdate.active) {
    memberToUpdate.inactiveSince = new Date().toISOString();
  } else if (!oldMember.active && memberToUpdate.active) {
    memberToUpdate.inactiveSince = null;
  }

  members[index] = calculateMemberTier(memberToUpdate);
  return JSON.parse(JSON.stringify(members[index]));
};

export const deleteMember = async (memberId: string): Promise<{ success: true }> => {
  await simulateDelay(300);
  const initialLength = members.length;
  members = members.filter(m => m.id !== memberId);
  if (members.length === initialLength) {
    throw new Error('Member not found');
  }
  return { success: true };
};

export const renewPolicy = async (memberId: string, policyId: string): Promise<Member> => {
    await simulateDelay(300);
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
        throw new Error('Member not found');
    }

    const policyIndex = members[memberIndex].policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
        throw new Error('Policy not found');
    }

    const currentRenewalDate = new Date(members[memberIndex].policies[policyIndex].renewalDate);
    currentRenewalDate.setFullYear(currentRenewalDate.getFullYear() + 1);
    members[memberIndex].policies[policyIndex].renewalDate = currentRenewalDate.toISOString().split('T')[0];
    
    // Recalculate tier just in case logic changes in future
    members[memberIndex] = calculateMemberTier(members[memberIndex]);

    return JSON.parse(JSON.stringify(members[memberIndex]));
};

export const findMemberByMobile = async (mobile: string): Promise<Partial<Member> | null> => {
    await simulateDelay(600);
    const cleanedMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
    if (preRegisteredUsers[cleanedMobile]) {
        return {
            ...preRegisteredUsers[cleanedMobile],
            processStage: 'Initial Contact'
        };
    }
    return null;
};

// --- Route API Functions ---
export const getRoutes = async (): Promise<Route[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(routes));
};

export const updateRoute = async (routeData: Route): Promise<Route> => {
    await simulateDelay(150);
    const index = routes.findIndex(r => r.id === routeData.id);
    if (index === -1) {
        throw new Error('Route not found');
    }
    routes[index] = { ...routes[index], ...routeData };
    return JSON.parse(JSON.stringify(routes[index]));
};


// --- Lead API Functions ---
export const getLeads = async (): Promise<Lead[]> => {
    await simulateDelay(400);
    return JSON.parse(JSON.stringify(leads));
};

export const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'company' | 'companyId'>, companyId: string): Promise<Lead> => {
    await simulateDelay(300);
    const companyName = companies.find(c => c.id === companyId)?.name || 'Unknown';
    const newLead: Lead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...leadData,
        createdAt: new Date().toISOString(),
        status: leadData.status || 'Lead',
        company: companyName,
        companyId: companyId
    };
    leads.push(newLead);
    return JSON.parse(JSON.stringify(newLead));
};

export const updateLead = async (leadData: Lead): Promise<Lead> => {
    await simulateDelay(300);
    const index = leads.findIndex(l => l.id === leadData.id);
    if (index === -1) {
        throw new Error('Lead not found');
    }
    leads[index] = { ...leads[index], ...leadData };
    return JSON.parse(JSON.stringify(leads[index]));
};

export const deleteLead = async (leadId: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    const initialLength = leads.length;
    leads = leads.filter(l => l.id !== leadId);
    if (leads.length === initialLength) {
        throw new Error('Lead not found');
    }
    return { success: true };
};

// --- Operating Company API Functions ---
export const getOperatingCompanies = async (): Promise<Company[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(companies));
};

export const createOperatingCompany = async (companyData: Omit<Company, 'id'>): Promise<Company> => {
    await simulateDelay(300);
    const newCompany: Company = {
        id: companyData.companyCode || `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...companyData,
        dateOfCreation: new Date().toISOString().split('T')[0],
        active: true,
    };
    companies.push(newCompany);
    return JSON.parse(JSON.stringify(newCompany));
};

export const updateOperatingCompany = async (companyData: Company): Promise<Company> => {
    await simulateDelay(300);
    const index = companies.findIndex(c => c.id === companyData.id);
    if (index === -1) {
        throw new Error('Company not found');
    }
    companies[index] = { ...companies[index], ...companyData };
    return JSON.parse(JSON.stringify(companies[index]));
};

// --- Branch API Functions ---
export const getFinrootsBranches = async (): Promise<FinRootsBranch[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(finrootsBranchesData));
};

export const createBranch = async (branchData: Omit<FinRootsBranch, 'id'>): Promise<FinRootsBranch> => {
    await simulateDelay(300);
    const newBranch: FinRootsBranch = {
        id: `frb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...branchData,
        active: true,
    };
    finrootsBranchesData.push(newBranch);
    return JSON.parse(JSON.stringify(newBranch));
};

export const updateBranch = async (branchData: FinRootsBranch): Promise<FinRootsBranch> => {
    await simulateDelay(300);
    const index = finrootsBranchesData.findIndex(b => b.id === branchData.id);
    if (index === -1) {
        throw new Error('Branch not found');
    }
    finrootsBranchesData[index] = { ...finrootsBranchesData[index], ...branchData };
    return JSON.parse(JSON.stringify(finrootsBranchesData[index]));
};

// --- NEW: Role Permissions API Functions ---
export const getRolePermissions = async (): Promise<RolePermissions[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(rolePermissionsData));
};

export const updateRolePermissions = async (updatedPermissions: RolePermissions): Promise<RolePermissions> => {
    await simulateDelay(200);
    const index = rolePermissionsData.findIndex(p => p.role === updatedPermissions.role);
    if (index === -1) {
        throw new Error(`Role '${updatedPermissions.role}' not found for permission update.`);
    }
    rolePermissionsData[index] = { ...rolePermissionsData[index], ...updatedPermissions };
    return JSON.parse(JSON.stringify(rolePermissionsData[index]));
};
