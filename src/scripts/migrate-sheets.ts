import * as fs from 'fs';
import * as path from 'path';
import {
  ClientStatus,
  ContentType,
  Department,
  EditStatus,
  Priority,
  ProjectStage,
  RevisionRound,
} from '../config/tbm.config';
import { mapStageToClientStatus } from '../workflows/stage-machine';

export interface RawBrand {
  id: string;
  name: string;
  pocName: string;
  pocEmail: string;
  primaryColor: string;
  secondaryColor: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface RawMember {
  id: string;
  name: string;
  email: string;
  department: Department;
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
}

export interface RawProject {
  id: string;
  title: string;
  brandId: string;
  contentType: ContentType;
  currentStage: ProjectStage;
  editStatus: EditStatus;
  revisionRound: RevisionRound;
  assignedToId: string;
  department: Department;
  clientStatus: ClientStatus;
  targetDelivery: string;
  internalNotes: string;
  priority: Priority;
  deadline: string;
  lastUpdated: string;
}

export function parseCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const records: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    records.push(obj as T);
  }

  return records;
}

export function chunkArray<T>(items: T[], chunkSize: number = 60): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function computeOverallStatus(
  deadlineStr: string,
  currentStage: ProjectStage,
): string {
  const deadline = new Date(deadlineStr).getTime();
  const today = Date.now();
  if (
    deadline < today &&
    currentStage !== ProjectStage.DELIVERED &&
    currentStage !== ProjectStage.CLOSED
  ) {
    return '⚠️ OVERDUE';
  }
  return '✅ On Track';
}

export async function runMigration() {
  const dataDir = path.resolve(__dirname, '../data');
  const brandsFile = path.join(dataDir, 'brands.csv');
  const membersFile = path.join(dataDir, 'team_members.csv');
  const projectsFile = path.join(dataDir, 'projects.csv');

  console.log('=====================================================');
  console.log('   TBM CRM — GOOGLE SHEETS TO TWENTY MIGRATION       ');
  console.log('=====================================================');

  const rawBrands = parseCsv<RawBrand>(brandsFile);
  const rawMembers = parseCsv<RawMember>(membersFile);
  const rawProjects = parseCsv<RawProject>(projectsFile);

  console.log(`[1/4] Found ${rawBrands.length} Brands in CSV`);
  console.log(`[2/4] Found ${rawMembers.length} Team Members in CSV`);
  console.log(`[3/4] Found ${rawProjects.length} Projects in CSV`);

  const brandIdMap = new Set(rawBrands.map(b => b.id));
  const memberIdMap = new Set(rawMembers.map(m => m.id));

  // Validate Relations
  const orphanedBrands: string[] = [];
  const orphanedAssignees: string[] = [];

  const processedProjects = rawProjects.map(proj => {
    if (!brandIdMap.has(proj.brandId)) {
      orphanedBrands.push(`Project "${proj.title}" -> missing brand ${proj.brandId}`);
    }
    if (!memberIdMap.has(proj.assignedToId)) {
      orphanedAssignees.push(`Project "${proj.title}" -> missing assignee ${proj.assignedToId}`);
    }

    const overallStatus = computeOverallStatus(proj.deadline, proj.currentStage);
    const computedClientStatus = mapStageToClientStatus(proj.currentStage);

    return {
      ...proj,
      clientStatus: computedClientStatus,
      overallStatus,
    };
  });

  if (orphanedBrands.length > 0 || orphanedAssignees.length > 0) {
    console.error('❌ Data integrity error: orphaned relations detected:');
    orphanedBrands.forEach(e => console.error('  ', e));
    orphanedAssignees.forEach(e => console.error('  ', e));
    throw new Error('Migration aborted due to relation inconsistencies.');
  }

  // Chunking validation (max 60 per Twenty API limit)
  const brandBatches = chunkArray(rawBrands, 60);
  const memberBatches = chunkArray(rawMembers, 60);
  const projectBatches = chunkArray(processedProjects, 60);

  console.log(`[4/4] Batched into ${projectBatches.length} batch(es) for Twenty API import (<=60 records/batch).`);

  return {
    success: true,
    brandsImported: rawBrands.length,
    membersImported: rawMembers.length,
    projectsImported: processedProjects.length,
    batchCount: projectBatches.length,
    projects: processedProjects,
  };
}

if (require.main === module) {
  runMigration()
    .then(report => {
      console.log('✅ Migration Simulation Succeeded:');
      console.log(`   - Brands: ${report.brandsImported}`);
      console.log(`   - Members: ${report.membersImported}`);
      console.log(`   - Projects: ${report.projectsImported}`);
    })
    .catch(err => {
      console.error('❌ Migration Failed:', err);
      process.exit(1);
    });
}
