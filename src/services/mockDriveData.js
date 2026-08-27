/**
 * Mock Google Drive folder data based on the exact user screenshots:
 * Screenshots show:
 * - Root folder: "Major Project 2 - June 2026 Semester"
 * - Student folders: "Chea Bunthay - Major...", "Hak Venthean - Major...", "Hor Kimly - Major...", etc.
 * - Subfolders: "All Final Material", "Concept Note (Week 2 - 4)", "Progress Report (Week 5 - 8)"
 * - Week subfolders: "Week 2" (Empty state as in Screenshot 4), "Week 7" (File: "Progress Week7.docx" as in Screenshot 1)
 */

export const MOCK_ROOT_FOLDER = {
  id: '1QRHck2OWHZmDuqqZlBJQNHLdc12ts2gu',
  name: 'Major Project 2 - June 2026 Semester',
  mimeType: 'application/vnd.google-apps.folder',
  owners: [{ displayName: 'Lecturer Admin', emailAddress: 'lecturer@university.edu.kh' }],
  modifiedTime: '2026-08-27T08:30:00.000Z',
  createdTime: '2026-06-01T00:00:00.000Z',
  webViewLink: 'https://drive.google.com/drive/u/1/folders/1QRHck2OWHZmDuqqZlBJQNHLdc12ts2gu'
};

export const MOCK_AUDIT_RESULT = {
  rootFolder: MOCK_ROOT_FOLDER,
  scannedAt: new Date().toISOString(),
  stats: {
    totalFoldersScanned: 48,
    studentFoldersCount: 8,
    totalFilesFound: 30,
    submittedFoldersCount: 24,
    emptyFoldersCount: 14,
    uniqueSubmittersCount: 8
  },
  // Detailed file list
  files: [
    // Chea Bunthay
    {
      id: 'file_000',
      name: 'Chea_Bunthay_Final_Project_Package.zip',
      mimeType: 'application/zip',
      size: 15400000,
      formattedSize: '14.7 MB',
      createdTime: '2026-08-27T10:00:00.000Z',
      createdTimeFormatted: 'Aug 27, 2026 10:00 AM',
      modifiedTime: '2026-08-27T10:00:00.000Z',
      modifiedTimeFormatted: 'Aug 27, 2026 10:00 AM',
      ownerName: 'Chea Bunthay',
      ownerEmail: 'chea.bunthay@student.edu.kh',
      lastModifiedBy: 'Chea Bunthay',
      folderPath: 'Major Project 2 > Chea Bunthay > All Final Material',
      studentName: 'Chea Bunthay',
      milestone: 'All Final Material',
      webViewLink: 'https://drive.google.com'
    },
    {
      id: 'file_001',
      name: 'Progress Week7.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 2458000,
      formattedSize: '2.3 MB',
      createdTime: '2026-08-26T14:15:00.000Z',
      createdTimeFormatted: 'Aug 26, 2026 02:15 PM',
      modifiedTime: '2026-08-26T16:30:00.000Z',
      modifiedTimeFormatted: 'Aug 26, 2026 04:30 PM',
      ownerName: 'Chea Bunthay',
      ownerEmail: 'chea.bunthay@student.edu.kh',
      lastModifiedBy: 'Chea Bunthay',
      folderPath: 'Major Project 2 > Chea Bunthay > Progress Report > Week 7',
      studentName: 'Chea Bunthay',
      milestone: 'Week 7',
      webViewLink: 'https://drive.google.com/drive/u/1/folders/1PGBw966NPQL4w1LyA7HHHgZSi6Vw2OVw'
    },
    {
      id: 'file_002',
      name: 'Progress_Week5.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1820000,
      formattedSize: '1.7 MB',
      createdTime: '2026-08-12T09:10:00.000Z',
      createdTimeFormatted: 'Aug 12, 2026 09:10 AM',
      modifiedTime: '2026-08-12T09:10:00.000Z',
      modifiedTimeFormatted: 'Aug 12, 2026 09:10 AM',
      ownerName: 'Chea Bunthay',
      ownerEmail: 'chea.bunthay@student.edu.kh',
      lastModifiedBy: 'Chea Bunthay',
      folderPath: 'Major Project 2 > Chea Bunthay > Progress Report > Week 5',
      studentName: 'Chea Bunthay',
      milestone: 'Week 5',
      webViewLink: 'https://drive.google.com'
    },
    {
      id: 'file_003',
      name: 'Concept_Note_Final_Approved.pdf',
      mimeType: 'application/pdf',
      size: 3410000,
      formattedSize: '3.3 MB',
      createdTime: '2026-07-28T11:45:00.000Z',
      createdTimeFormatted: 'Jul 28, 2026 11:45 AM',
      modifiedTime: '2026-07-28T11:45:00.000Z',
      modifiedTimeFormatted: 'Jul 28, 2026 11:45 AM',
      ownerName: 'Chea Bunthay',
      ownerEmail: 'chea.bunthay@student.edu.kh',
      lastModifiedBy: 'Chea Bunthay',
      folderPath: 'Major Project 2 > Chea Bunthay > Concept Note > Final Concept',
      studentName: 'Chea Bunthay',
      milestone: 'Final Concept',
      webViewLink: 'https://drive.google.com'
    },
    {
      id: 'file_004',
      name: 'Concept_Note_Week3_Draft.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1100000,
      formattedSize: '1.0 MB',
      createdTime: '2026-07-15T15:20:00.000Z',
      createdTimeFormatted: 'Jul 15, 2026 03:20 PM',
      modifiedTime: '2026-07-15T15:20:00.000Z',
      modifiedTimeFormatted: 'Jul 15, 2026 03:20 PM',
      ownerName: 'Chea Bunthay',
      ownerEmail: 'chea.bunthay@student.edu.kh',
      lastModifiedBy: 'Chea Bunthay',
      folderPath: 'Major Project 2 > Chea Bunthay > Concept Note > Week 3',
      studentName: 'Chea Bunthay',
      milestone: 'Week 3',
      webViewLink: 'https://drive.google.com'
    },

    // Hak Venthean
    {
      id: 'file_005',
      name: 'Hak_Venthean_Progress_Week7.pdf',
      mimeType: 'application/pdf',
      size: 4200000,
      formattedSize: '4.0 MB',
      createdTime: '2026-08-25T16:00:00.000Z',
      createdTimeFormatted: 'Aug 25, 2026 04:00 PM',
      modifiedTime: '2026-08-25T16:00:00.000Z',
      modifiedTimeFormatted: 'Aug 25, 2026 04:00 PM',
      ownerName: 'Hak Venthean',
      ownerEmail: 'hak.venthean@student.edu.kh',
      lastModifiedBy: 'Hak Venthean',
      folderPath: 'Major Project 2 > Hak Venthean > Progress Report > Week 7',
      studentName: 'Hak Venthean',
      milestone: 'Week 7',
      webViewLink: 'https://drive.google.com'
    },
    {
      id: 'file_006',
      name: 'Concept_Note_Week2_HV.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 950000,
      formattedSize: '927 KB',
      createdTime: '2026-07-08T10:30:00.000Z',
      createdTimeFormatted: 'Jul 8, 2026 10:30 AM',
      modifiedTime: '2026-07-08T10:30:00.000Z',
      modifiedTimeFormatted: 'Jul 8, 2026 10:30 AM',
      ownerName: 'Hak Venthean',
      ownerEmail: 'hak.venthean@student.edu.kh',
      lastModifiedBy: 'Hak Venthean',
      folderPath: 'Major Project 2 > Hak Venthean > Concept Note > Week 2',
      studentName: 'Hak Venthean',
      milestone: 'Week 2',
      webViewLink: 'https://drive.google.com'
    },

    // Hor Kimly
    {
      id: 'file_007',
      name: 'Hor_Kimly_Concept_Note.pdf',
      mimeType: 'application/pdf',
      size: 2890000,
      formattedSize: '2.8 MB',
      createdTime: '2026-07-10T14:00:00.000Z',
      createdTimeFormatted: 'Jul 10, 2026 02:00 PM',
      modifiedTime: '2026-07-10T14:00:00.000Z',
      modifiedTimeFormatted: 'Jul 10, 2026 02:00 PM',
      ownerName: 'Hor Kimly',
      ownerEmail: 'hor.kimly@student.edu.kh',
      lastModifiedBy: 'Hor Kimly',
      folderPath: 'Major Project 2 > Hor Kimly > Concept Note > Final Concept',
      studentName: 'Hor Kimly',
      milestone: 'Final Concept',
      webViewLink: 'https://drive.google.com'
    },

    // Hour Chansopheak
    {
      id: 'file_008',
      name: 'Chansopheak_Week7_Report.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1540000,
      formattedSize: '1.5 MB',
      createdTime: '2026-08-26T20:10:00.000Z',
      createdTimeFormatted: 'Aug 26, 2026 08:10 PM',
      modifiedTime: '2026-08-26T20:10:00.000Z',
      modifiedTimeFormatted: 'Aug 26, 2026 08:10 PM',
      ownerName: 'Hour Chansopheak',
      ownerEmail: 'hour.chansopheak@student.edu.kh',
      lastModifiedBy: 'Hour Chansopheak',
      folderPath: 'Major Project 2 > Hour Chansopheak > Progress Report > Week 7',
      studentName: 'Hour Chansopheak',
      milestone: 'Week 7',
      webViewLink: 'https://drive.google.com'
    }
  ],

  // Columns / Milestones for Submission Matrix (Includes top-level folders & all weeks)
  milestones: ['All Final Material', 'Week 2', 'Week 3', 'Week 4', 'Final Concept', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],

  // Matrix rows (per student)
  matrixRows: [
    {
      studentName: 'Chea Bunthay',
      email: 'chea.bunthay@student.edu.kh',
      folderPath: 'Major Project 2 > Chea Bunthay - Major Project 2',
      submittedCount: 5,
      emptyCount: 4,
      submissions: {
        'All Final Material': { isFolderEmpty: false, folderPath: '... > All Final Material', files: [{ name: 'Chea_Bunthay_Final_Project_Package.zip', date: 'Aug 27, 2026', owner: 'Chea Bunthay' }] },
        'Week 2': { isFolderEmpty: true, folderPath: '... > Concept Note > Week 2', files: [] },
        'Week 3': { isFolderEmpty: false, folderPath: '... > Concept Note > Week 3', files: [{ name: 'Concept_Note_Week3_Draft.docx', date: 'Jul 15, 2026', owner: 'Chea Bunthay' }] },
        'Week 4': { isFolderEmpty: true, folderPath: '... > Concept Note > Week 4', files: [] },
        'Final Concept': { isFolderEmpty: false, folderPath: '... > Concept Note > Final Concept', files: [{ name: 'Concept_Note_Final_Approved.pdf', date: 'Jul 28, 2026', owner: 'Chea Bunthay' }] },
        'Week 5': { isFolderEmpty: false, folderPath: '... > Progress Report > Week 5', files: [{ name: 'Progress_Week5.docx', date: 'Aug 12, 2026', owner: 'Chea Bunthay' }] },
        'Week 6': { isFolderEmpty: true, folderPath: '... > Progress Report > Week 6', files: [] },
        'Week 7': { isFolderEmpty: false, folderPath: '... > Progress Report > Week 7', files: [{ name: 'Progress Week7.docx', date: 'Aug 26, 2026', owner: 'Chea Bunthay' }] },
        'Week 8': { isFolderEmpty: true, folderPath: '... > Progress Report > Week 8', files: [] }
      }
    },
    {
      studentName: 'Hak Venthean',
      email: 'hak.venthean@student.edu.kh',
      folderPath: 'Major Project 2 > Hak Venthean - Major Project 2',
      submittedCount: 2,
      emptyCount: 7,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: false, folderPath: '... > Concept Note > Week 2', files: [{ name: 'Concept_Note_Week2_HV.docx', date: 'Jul 8, 2026', owner: 'Hak Venthean' }] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: true, files: [] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: false, folderPath: '... > Progress Report > Week 7', files: [{ name: 'Hak_Venthean_Progress_Week7.pdf', date: 'Aug 25, 2026', owner: 'Hak Venthean' }] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    },
    {
      studentName: 'Hor Kimly',
      email: 'hor.kimly@student.edu.kh',
      folderPath: 'Major Project 2 > Hor Kimly - Major Project 2',
      submittedCount: 1,
      emptyCount: 8,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: true, files: [] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: false, files: [{ name: 'Hor_Kimly_Concept_Note.pdf', date: 'Jul 10, 2026', owner: 'Hor Kimly' }] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: true, files: [] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    },
    {
      studentName: 'Hour Chansopheak',
      email: 'hour.chansopheak@student.edu.kh',
      folderPath: 'Major Project 2 > Hour Chansopheak - Major Project 2',
      submittedCount: 1,
      emptyCount: 8,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: true, files: [] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: true, files: [] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: false, files: [{ name: 'Chansopheak_Week7_Report.docx', date: 'Aug 26, 2026', owner: 'Hour Chansopheak' }] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    },
    {
      studentName: 'Hout Chanmonyroth',
      email: 'hout.chanmonyroth@student.edu.kh',
      folderPath: 'Major Project 2 > Hout Chanmonyroth - Major Project 2',
      submittedCount: 0,
      emptyCount: 9,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: true, files: [] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: true, files: [] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: true, files: [] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    },
    {
      studentName: 'Hov Chanbo',
      email: 'hov.chanbo@student.edu.kh',
      folderPath: 'Major Project 2 > Hov Chanbo - Major Project 2',
      submittedCount: 0,
      emptyCount: 9,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: true, files: [] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: true, files: [] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: true, files: [] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    },
    {
      studentName: 'Khiev Piseth',
      email: 'khiev.piseth@student.edu.kh',
      folderPath: 'Major Project 2 > Khiev Piseth - Major Project 2',
      submittedCount: 0,
      emptyCount: 9,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: true, files: [] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: true, files: [] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: true, files: [] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    },
    {
      studentName: 'Leak Sithisak',
      email: 'leak.sithisak@student.edu.kh',
      folderPath: 'Major Project 2 > Leak Sithisak - Major Project 2',
      submittedCount: 0,
      emptyCount: 9,
      submissions: {
        'All Final Material': { isFolderEmpty: true, files: [] },
        'Week 2': { isFolderEmpty: true, files: [] },
        'Week 3': { isFolderEmpty: true, files: [] },
        'Week 4': { isFolderEmpty: true, files: [] },
        'Final Concept': { isFolderEmpty: true, files: [] },
        'Week 5': { isFolderEmpty: true, files: [] },
        'Week 6': { isFolderEmpty: true, files: [] },
        'Week 7': { isFolderEmpty: true, files: [] },
        'Week 8': { isFolderEmpty: true, files: [] }
      }
    }
  ],

  // Visual Folder Tree structure
  tree: {
    name: 'Major Project 2 - June 2026 Semester',
    type: 'folder',
    children: [
      {
        name: 'Chea Bunthay - Major Project 2',
        type: 'folder',
        children: [
          {
            name: 'All Final Material',
            type: 'folder',
            children: [
              { name: 'Chea_Bunthay_Final_Project_Package.zip', type: 'file', owner: 'Chea Bunthay', time: 'Aug 27, 2026' }
            ]
          },
          {
            name: 'Concept Note (Week 2 - 4)',
            type: 'folder',
            children: [
              { name: 'Week 2 (EMPTY)', type: 'folder', isEmpty: true, children: [] },
              {
                name: 'Week 3',
                type: 'folder',
                children: [
                  { name: 'Concept_Note_Week3_Draft.docx', type: 'file', owner: 'Chea Bunthay', time: 'Jul 15, 2026' }
                ]
              },
              { name: 'Week 4 (EMPTY)', type: 'folder', isEmpty: true, children: [] },
              {
                name: 'Final Concept',
                type: 'folder',
                children: [
                  { name: 'Concept_Note_Final_Approved.pdf', type: 'file', owner: 'Chea Bunthay', time: 'Jul 28, 2026' }
                ]
              }
            ]
          },
          {
            name: 'Progress Report (Week 5 - 8)',
            type: 'folder',
            children: [
              {
                name: 'Week 5',
                type: 'folder',
                children: [
                  { name: 'Progress_Week5.docx', type: 'file', owner: 'Chea Bunthay', time: 'Aug 12, 2026' }
                ]
              },
              { name: 'Week 6 (EMPTY)', type: 'folder', isEmpty: true, children: [] },
              {
                name: 'Week 7',
                type: 'folder',
                children: [
                  { name: 'Progress Week7.docx', type: 'file', owner: 'Chea Bunthay', time: 'Aug 26, 2026' }
                ]
              },
              { name: 'Week 8 (EMPTY)', type: 'folder', isEmpty: true, children: [] }
            ]
          }
        ]
      },
      {
        name: 'Hak Venthean - Major Project 2',
        type: 'folder',
        children: [
          { name: 'All Final Material (EMPTY)', type: 'folder', isEmpty: true, children: [] },
          {
            name: 'Concept Note (Week 2 - 4)',
            type: 'folder',
            children: [
              {
                name: 'Week 2',
                type: 'folder',
                children: [
                  { name: 'Concept_Note_Week2_HV.docx', type: 'file', owner: 'Hak Venthean', time: 'Jul 8, 2026' }
                ]
              }
            ]
          },
          {
            name: 'Progress Report (Week 5 - 8)',
            type: 'folder',
            children: [
              {
                name: 'Week 7',
                type: 'folder',
                children: [
                  { name: 'Hak_Venthean_Progress_Week7.pdf', type: 'file', owner: 'Hak Venthean', time: 'Aug 25, 2026' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};
