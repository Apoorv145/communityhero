import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy data...');

  // Create or get default user
  let defaultUser = await prisma.user.findUnique({ where: { email: 'citizen@kanpur.in' } });
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        firebaseUid: 'dummy_firebase_uid_123',
        name: 'Kanpur Citizen',
        email: 'citizen@kanpur.in',
        role: 'CITIZEN',
      }
    });
  }

  const dummyIssues = [
    {
      title: 'Massive Pothole near Geeta Nagar Crossing',
      description: 'Huge crater causing traffic jams and vehicle damage.',
      lat: 26.48, lng: 80.29, // Kakadeo
      address: 'Geeta Nagar, Kakadeo, Kanpur',
      category: 'Pothole', severity: 8, priority: 'HIGH', priorityScore: 85, department: 'Public Works Department',
      repairEstimate: '2 Days, $500', status: 'REPORTED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Overflowing Garbage Bin',
      description: 'Trash has not been picked up for 3 days. Foul smell.',
      lat: 26.485, lng: 80.30, // Kakadeo
      address: 'Deo Nagar, Kakadeo, Kanpur',
      category: 'Garbage', severity: 6, priority: 'MEDIUM', priorityScore: 60, department: 'Sanitation Department',
      repairEstimate: '1 Day, $100', status: 'REPORTED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Broken Streetlight',
      description: 'Street is completely dark, unsafe for pedestrians at night.',
      lat: 26.46, lng: 80.35, // Mall Road
      address: 'Phool Bagh, Mall Road, Kanpur',
      category: 'Streetlight', severity: 7, priority: 'MEDIUM', priorityScore: 70, department: 'Electrical Department',
      repairEstimate: '3 Days, $200', status: 'RESOLVED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1512404179374-124b171630b9?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Major Water Main Leak',
      description: 'Continuous flow of water wasting thousands of liters.',
      lat: 26.465, lng: 80.345, // Mall Road
      address: 'Bada Chauraha, Mall Road, Kanpur',
      category: 'Water Leakage', severity: 9, priority: 'CRITICAL', priorityScore: 95, department: 'Jal Sansthan',
      repairEstimate: '24 Hours, $1000', status: 'REPORTED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1542038583-05452f143733?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Blocked Drain Causing Flooding',
      description: 'Sewage overflowing onto the main street.',
      lat: 26.43, lng: 80.31, // Govind Nagar
      address: 'Block 6, Govind Nagar, Kanpur',
      category: 'Water Leakage', severity: 8, priority: 'HIGH', priorityScore: 88, department: 'Sanitation Department',
      repairEstimate: '2 Days, $400', status: 'REPORTED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1584483758137-fc2a8d56b0d9?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Road Cave-in (Sinkhole)',
      description: 'Dangerous sinkhole developed after heavy rains.',
      lat: 26.435, lng: 80.32, // Govind Nagar
      address: 'Fazalganj Chauraha, Govind Nagar, Kanpur',
      category: 'Road Issue', severity: 10, priority: 'CRITICAL', priorityScore: 100, department: 'Public Works Department',
      repairEstimate: '5 Days, $2000', status: 'REPORTED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1585860228308-54c330df32eb?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Garbage Dumped Illegally',
      description: 'Construction waste dumped on empty plot.',
      lat: 26.425, lng: 80.315, // Govind Nagar
      address: 'Block 2, Govind Nagar, Kanpur',
      category: 'Garbage', severity: 4, priority: 'LOW', priorityScore: 40, department: 'Sanitation Department',
      repairEstimate: '3 Days, $300', status: 'RESOLVED', reporterId: defaultUser.id,
      imageUrl: null
    },
    {
      title: 'Fallen Tree on Road',
      description: 'Tree blocking half the road after storm.',
      lat: 26.475, lng: 80.295, // Kakadeo
      address: 'Double Pulia, Kakadeo, Kanpur',
      category: 'Road Issue', severity: 9, priority: 'CRITICAL', priorityScore: 92, department: 'Forest Department',
      repairEstimate: '12 Hours, $150', status: 'REPORTED', reporterId: defaultUser.id,
      imageUrl: 'https://images.unsplash.com/photo-1610300481861-1b07cf034c4f?auto=format&fit=crop&q=80&w=800'
    }
  ];

  for (const issue of dummyIssues) {
    await prisma.issue.create({ data: issue });
  }

  console.log('Successfully seeded 8 dummy issues in Kanpur!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
