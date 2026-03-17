export interface School {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  address: string;
  contact_email?: string;
  contact_phone?: string;
  number_of_students?: number;
  number_of_teachers?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'AD' | 'TC' | 'ST';
  schoolId: string;
  status: 'green' | 'yellow' | 'red';
  isLicensed: boolean;
  wins: number;
  profilePicture?: string;
}

export interface Exam {
  id: string;
  subject: string;
  date: string;
  duration: number; // in minutes
  numberOfQuestions: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  schoolId: string;
  authorId: string;
  createdAt: string;
  urgent: boolean;
}

export interface Material {
  id: string;
  title: string;
  subject: string;
  price: number;
  description: string;
  chapter: string;
  sellerId: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
}

// Mock data
export const mockSchools: School[] = [
  {
    id: '1',
    name: 'Greenwood High School',
    status: 'active',
    address: '123 Education St, Learning City, LC 12345'
  },
  {
    id: '2',
    name: 'Riverside Academy',
    status: 'active',
    address: '456 Knowledge Ave, Study Town, ST 67890'
  },
  {
    id: '3',
    name: 'Mountain View Institute',
    status: 'inactive',
    address: '789 Wisdom Blvd, School District, SD 13579'
  },
  {
    id: '4',
    name: 'Coastal Education Center',
    status: 'active',
    address: '321 Learning Lane, Edu City, EC 24680'
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'admin@greenwood.edu',
    role: 'AD',
    schoolId: '1',
    status: 'green',
    isLicensed: true,
    wins: 0
  },
  {
    id: '2',
    name: 'Sarah Teacher',
    email: 'sarah.teacher@greenwood.edu',
    role: 'TC',
    schoolId: '1',
    status: 'green',
    isLicensed: true,
    wins: 5
  },
  {
    id: '3',
    name: 'Mike Student',
    email: 'mike.student@greenwood.edu',
    role: 'ST',
    schoolId: '1',
    status: 'yellow',
    isLicensed: true,
    wins: 2
  },
  {
    id: '4',
    name: 'Emma Thompson',
    email: 'emma.thompson@riverside.edu',
    role: 'TC',
    schoolId: '2',
    status: 'green',
    isLicensed: true,
    wins: 8
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.wilson@riverside.edu',
    role: 'ST',
    schoolId: '2',
    status: 'red',
    isLicensed: false,
    wins: 0
  }
];

export const mockExams: Exam[] = [
  {
    id: '1',
    subject: 'Mathematics',
    date: '2025-01-25',
    duration: 90,
    numberOfQuestions: 30
  },
  {
    id: '2',
    subject: 'Science',
    date: '2025-01-28',
    duration: 120,
    numberOfQuestions: 40
  },
  {
    id: '3',
    subject: 'Literature',
    date: '2025-02-02',
    duration: 75,
    numberOfQuestions: 25
  }
];

export const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1
  },
  {
    id: '2',
    text: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Earth', 'Mars'],
    correctAnswer: 1
  },
  {
    id: '3',
    text: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 1
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to New Semester',
    content: 'We are excited to start the new academic year with enhanced learning opportunities.',
    schoolId: '1',
    authorId: '1',
    createdAt: '2025-01-15T10:00:00Z',
    urgent: false
  },
  {
    id: '2',
    title: 'Exam Schedule Released',
    content: 'Please check your exam calendar for upcoming assessments.',
    schoolId: '1',
    authorId: '1',
    createdAt: '2025-01-18T14:30:00Z',
    urgent: true
  }
];

export const mockMaterials: Material[] = [
  {
    id: '1',
    title: 'Advanced Calculus Study Guide',
    subject: 'Mathematics',
    price: 29.99,
    description: 'Comprehensive guide covering derivatives and integrals',
    chapter: 'Chapter 12 - Calculus',
    sellerId: '2',
    upvotes: 15,
    downvotes: 2,
    comments: [
      {
        id: '1',
        authorId: '3',
        authorName: 'Mike Student',
        content: 'Very helpful for understanding complex concepts!',
        createdAt: '2025-01-10T09:00:00Z'
      }
    ]
  },
  {
    id: '2',
    title: 'Chemistry Lab Manual',
    subject: 'Science',
    price: 19.99,
    description: 'Step-by-step lab procedures and safety guidelines',
    chapter: 'Chapter 8 - Laboratory Techniques',
    sellerId: '4',
    upvotes: 22,
    downvotes: 1,
    comments: []
  }
];