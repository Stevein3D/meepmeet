// BGG API helper with rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface BGGSearchResult {
  id: number
  name: string
  yearPublished: number
}

export interface BGGGame {
  id: number
  name: string
  image: string
  minPlayers: number
  maxPlayers: number
  playingTime: number
  yearPublished: number
  averageWeight: number
  description: string
}

async function parseXML(xml: string): Promise<any> {
  // Simple XML parsing for BGG's format
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  return doc
}

function xmlToJson(xml: Document): any {
  // Helper to convert XML to usable JSON structure
  const items = xml.getElementsByTagName('item')
  if (items.length === 0) return null
  
  return Array.from(items)
}

export async function searchBGG(query: string): Promise<BGGSearchResult[]> {
  try {
    console.log('Searching BGG for:', query)
    
    // Add delay to respect rate limits
    await delay(1000)
    
    const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      },
    })
    
    console.log('BGG response status:', response.status)
    
    if (!response.ok) {
      const text = await response.text()
      console.error('BGG error response:', text)
      throw new Error(`BGG returned ${response.status}`)
    }
    
    const xml = await response.text()
    console.log('BGG XML (first 500 chars):', xml.substring(0, 500))
    
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const items = doc.getElementsByTagName('item')
    
    if (items.length === 0) {
      return []
    }
    
    const results: BGGSearchResult[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const id = item.getAttribute('id')
      const nameEl = item.getElementsByTagName('name')[0]
      const name = nameEl?.getAttribute('value')
      const yearEl = item.getElementsByTagName('yearpublished')[0]
      const year = yearEl?.getAttribute('value')
      
      if (id && name) {
        results.push({
          id: parseInt(id),
          name,
          yearPublished: year ? parseInt(year) : 0,
        })
      }
    }
    
    return results
  } catch (error) {
    console.error('BGG search error:', error)
    throw error
  }
}

export async function getBGGGame(id: number): Promise<BGGGame | null> {
  try {
    console.log('Fetching BGG game:', id)
    
    // Add delay to respect rate limits
    await delay(1000)
    
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      },
    })
    
    if (!response.ok) {
      const text = await response.text()
      console.error('BGG error response:', text)
      throw new Error(`BGG returned ${response.status}`)
    }
    
    const xml = await response.text()
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const items = doc.getElementsByTagName('item')
    
    if (items.length === 0) {
      return null
    }
    
    const item = items[0]
    
    // Get primary name
    const names = item.getElementsByTagName('name')
    let primaryName = ''
    for (let i = 0; i < names.length; i++) {
      if (names[i].getAttribute('type') === 'primary') {
        primaryName = names[i].getAttribute('value') || ''
        break
      }
    }
    
    const imageEl = item.getElementsByTagName('image')[0]
    const minPlayersEl = item.getElementsByTagName('minplayers')[0]
    const maxPlayersEl = item.getElementsByTagName('maxplayers')[0]
    const playingTimeEl = item.getElementsByTagName('playingtime')[0]
    const yearEl = item.getElementsByTagName('yearpublished')[0]
    const descEl = item.getElementsByTagName('description')[0]
    
    // Get complexity from stats
    const ratingsEl = item.getElementsByTagName('ratings')[0]
    const avgWeightEl = ratingsEl?.getElementsByTagName('averageweight')[0]
    
    return {
      id,
      name: primaryName,
      image: imageEl?.textContent || '',
      minPlayers: parseInt(minPlayersEl?.getAttribute('value') || '1'),
      maxPlayers: parseInt(maxPlayersEl?.getAttribute('value') || '1'),
      playingTime: parseInt(playingTimeEl?.getAttribute('value') || '0'),
      yearPublished: parseInt(yearEl?.getAttribute('value') || '0'),
      averageWeight: parseFloat(avgWeightEl?.getAttribute('value') || '0'),
      description: descEl?.textContent || '',
    }
  } catch (error) {
    console.error('BGG fetch error:', error)
    throw error
  }
}