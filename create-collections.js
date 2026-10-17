// Simple Node.js script to create Firebase collections directly
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccount = require('./src/main/resources/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createCollections() {
  try {
    console.log('Creating projectEmployees collection...');
    
    // Create projectEmployees collection with sample data
    const projectEmployeesRef = db.collection('projectEmployees');
    await projectEmployeesRef.doc('sample-assignment-1').set({
      projectId: 'sample-project-1',
      employeeId: '78IT4POlfg4o2ehDBmSe', // mc kenna's ID
      assignedDate: admin.firestore.Timestamp.now(),
      role: 'Developer',
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    await projectEmployeesRef.doc('sample-assignment-2').set({
      projectId: 'sample-project-2', 
      employeeId: 'employee-2-id',
      assignedDate: admin.firestore.Timestamp.now(),
      role: 'Designer',
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log('Creating employeeProjects collection...');
    
    // Create employeeProjects collection with sample data
    const employeeProjectsRef = db.collection('employeeProjects');
    await employeeProjectsRef.doc('emp-proj-1').set({
      employeeId: '78IT4POlfg4o2ehDBmSe', // mc kenna's ID
      projectId: 'sample-project-1',
      assignedDate: admin.firestore.Timestamp.now(),
      role: 'Developer',
      status: 'active',
      hoursLogged: 40,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    await employeeProjectsRef.doc('emp-proj-2').set({
      employeeId: 'employee-2-id',
      projectId: 'sample-project-2', 
      assignedDate: admin.firestore.Timestamp.now(),
      role: 'Designer',
      status: 'active',
      hoursLogged: 35,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log('Creating projectReports collection...');
    
    // Create projectReports collection with sample data
    const projectReportsRef = db.collection('projectReports');
    await projectReportsRef.doc('report-1').set({
      projectId: 'sample-project-1',
      reportType: 'weekly',
      startDate: admin.firestore.Timestamp.now(),
      endDate: admin.firestore.Timestamp.now(),
      totalHours: 40,
      employeesCount: 2,
      status: 'completed',
      generatedBy: 'manager-id',
      createdAt: admin.firestore.Timestamp.now()
    });

    console.log('✅ All collections created successfully!');
    console.log('📊 Collections now visible in Firebase:');
    console.log('  - projectEmployees');
    console.log('  - employeeProjects'); 
    console.log('  - projectReports');
    console.log('');
    console.log('🔍 You should now be able to see these collections in your Firebase console.');
    
  } catch (error) {
    console.error('❌ Error creating collections:', error);
  } finally {
    process.exit(0);
  }
}

createCollections();