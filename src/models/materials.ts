import type { Material } from './types.ts'

export const MATERIALS: Material[] = [
  { id: 'granito-sao-gabriel', name: 'Granito São Gabriel', category: 'granito' },
  { id: 'granito-preto-absoluto', name: 'Granito Preto Absoluto', category: 'granito' },
  { id: 'granito-verde-ubatuba', name: 'Granito Verde Ubatuba', category: 'granito' },
  { id: 'granito-branco-itaunas', name: 'Granito Branco Itaúnas', category: 'granito' },
  { id: 'granito-amarelo-ornamental', name: 'Granito Amarelo Ornamental', category: 'granito' },
  { id: 'granito-cinza-andorinha', name: 'Granito Cinza Andorinha', category: 'granito' },
  { id: 'marmore-carrara', name: 'Mármore Carrara', category: 'marmore' },
  { id: 'marmore-branco-thassos', name: 'Mármore Branco Thassos', category: 'marmore' },
  { id: 'quartzito-taj-mahal', name: 'Quartzito Taj Mahal', category: 'quartzito' },
  { id: 'porcelana-personalizada', name: 'Porcelana (especificar)', category: 'porcelana' },
]

export const DEFAULT_MATERIAL = MATERIALS[0]
