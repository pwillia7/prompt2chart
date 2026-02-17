import { Project } from '../types'
import { Dataset } from '../types'

export interface SampleDataset {
  id: string
  name: string
  fileName: string
  filePath: string
  description: string
  rowCount: number
  columns: string[]
  projectName: string
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'titanic',
    name: 'Titanic Passengers',
    fileName: 'titanic.csv',
    filePath: '/sample_data/titanic.csv',
    description: 'Passenger survival data from the Titanic — explore survival rates by class, age, and gender.',
    rowCount: 714,
    columns: ['survived', 'pclass', 'name', 'sex', 'age', 'fare', 'sibsp', 'parch'],
    projectName: 'Titanic Exploration',
  },
  {
    id: 'planets',
    name: 'Exoplanet Discoveries',
    fileName: 'planets.csv',
    filePath: '/sample_data/planets.csv',
    description: 'Confirmed exoplanets with orbital, mass, and distance data — visualize discovery trends.',
    rowCount: 1035,
    columns: ['method', 'number', 'orbital_period', 'mass', 'distance', 'year'],
    projectName: 'Exoplanet Exploration',
  },
]

export async function loadSampleDataset(
  sample: SampleDataset,
  createProject: (name: string) => Promise<Project | null>,
  uploadDataset: (projectId: string, file: File) => Promise<Dataset | null>,
): Promise<{ projectId: string }> {
  const project = await createProject(sample.projectName)
  if (!project) throw new Error('Failed to create project')

  const response = await fetch(sample.filePath)
  if (!response.ok) throw new Error('Failed to fetch sample data')

  const text = await response.text()
  const file = new File([text], sample.fileName, { type: 'text/csv' })

  const dataset = await uploadDataset(project.id, file)
  if (!dataset) throw new Error('Failed to upload dataset')

  return { projectId: project.id }
}
