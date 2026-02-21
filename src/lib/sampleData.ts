import { Project, InsightSuggestion } from '../types'
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

// Hardcoded suggestions for sample datasets — avoids API calls for every user
export const SAMPLE_SUGGESTIONS: Record<string, InsightSuggestion[]> = {
  titanic: [
    { prompt: 'How do survival rates vary across different passenger classes?', description: 'Survival rates by passenger class', chartType: 'bar', library: 'vega-lite' },
    { prompt: 'Is there a correlation between age, fare, and survival?', description: 'Age vs fare colored by survival', chartType: 'scatter', library: 'vega-lite' },
    { prompt: 'What is the fare distribution and are there outliers by gender?', description: 'Fare distribution by gender', chartType: 'bar', library: 'vega-lite' },
    { prompt: 'What is the composition of passengers by gender and survival?', description: 'Passenger composition by gender and survival', chartType: 'pie', library: 'd3' },
    { prompt: 'Are there survival patterns among passengers with shared last names?', description: 'Survival patterns by shared last names', chartType: 'bar', library: 'd3' },
  ],
  planets: [
    { prompt: 'How has the average mass of discoveries changed over time?', description: 'Average discovery mass over time', chartType: 'line', library: 'vega-lite' },
    { prompt: 'Is there a correlation between distance and mass of discoveries?', description: 'Distance vs mass correlation', chartType: 'scatter', library: 'vega-lite' },
    { prompt: 'What is the composition of discovery methods used?', description: 'Discovery methods composition', chartType: 'pie', library: 'd3' },
    { prompt: 'What are the distributions and outliers of orbital periods by method?', description: 'Orbital period distributions by method', chartType: 'bar', library: 'vega-lite' },
    { prompt: 'How do the number of discoveries vary by year?', description: 'Discovery count by year', chartType: 'bar', library: 'd3' },
  ],
}

// Returns hardcoded suggestions if the schema matches a sample dataset, otherwise undefined
export function getSampleSuggestions(columns: string[]): InsightSuggestion[] | undefined {
  const sorted = [...columns].sort().join(',')
  for (const sample of SAMPLE_DATASETS) {
    if ([...sample.columns].sort().join(',') === sorted) {
      return SAMPLE_SUGGESTIONS[sample.id]
    }
  }
  return undefined
}

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
