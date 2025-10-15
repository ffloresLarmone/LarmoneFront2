export interface Commune {
  id: string
  name: string
}

export interface City {
  id: string
  name: string
  communes: Commune[]
}

export interface Region {
  id: string
  name: string
  cities: City[]
}

export const regions: Region[] = [
  {
    id: 'rm',
    name: 'Región Metropolitana',
    cities: [
      {
        id: 'santiago',
        name: 'Santiago',
        communes: [
          { id: 'providencia', name: 'Providencia' },
          { id: 'las-condes', name: 'Las Condes' },
          { id: 'nunoa', name: 'Ñuñoa' },
        ],
      },
      {
        id: 'puente-alto',
        name: 'Puente Alto',
        communes: [
          { id: 'puente-alto-centro', name: 'Puente Alto Centro' },
          { id: 'las-vizas', name: 'Las Vizcachas' },
        ],
      },
    ],
  },
  {
    id: 'v',
    name: 'Región de Valparaíso',
    cities: [
      {
        id: 'valparaiso',
        name: 'Valparaíso',
        communes: [
          { id: 'valparaiso-centro', name: 'Valparaíso Centro' },
          { id: 'plazuela-anibal-pinto', name: 'Plazuela Aníbal Pinto' },
        ],
      },
      {
        id: 'vina-del-mar',
        name: 'Viña del Mar',
        communes: [
          { id: 'recreo', name: 'Recreo' },
          { id: 'miraflores', name: 'Miraflores' },
        ],
      },
    ],
  },
  {
    id: 'viii',
    name: 'Región del Biobío',
    cities: [
      {
        id: 'concepcion',
        name: 'Concepción',
        communes: [
          { id: 'concepcion-centro', name: 'Concepción Centro' },
          { id: 'san-pedro', name: 'San Pedro de la Paz' },
        ],
      },
      {
        id: 'los-angeles',
        name: 'Los Ángeles',
        communes: [
          { id: 'los-angeles-centro', name: 'Los Ángeles Centro' },
          { id: 'duqueco', name: 'Duqueco' },
        ],
      },
    ],
  },
]
