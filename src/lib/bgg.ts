import { XMLParser } from 'fast-xml-parser'
import { cache } from './cache'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
})

// BGG API helper with authentication
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const BGG_USERNAME = process.env.BGG_USERNAME
const BGG_API_TOKEN = process.env.BGG_API_TOKEN

// Cache durations
const SEARCH_CACHE_TTL = 60 * 60 // 1 hour in seconds
const GAME_CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds

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

export async function searchBGG(query: string): Promise<BGGSearchResult[]> {
  // Check cache first
  const cacheKey = `bgg:search:${query.toLowerCase()}`
  const cached = cache.get<BGGSearchResult[]>(cacheKey)
  if (cached) {
    console.log('Returning cached search results for:', query)
    return cached
  }

  try {
    console.log('Searching BGG API for:', query)
    
    await delay(1000) // Rate limiting
    
    const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${BGG_API_TOKEN}`,
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
    const result = parser.parse(xml)
    
    if (!result.items?.item) {
      return []
    }
    
    // Handle both single result (object) and multiple results (array)
    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item]
    
    const results = items.map((item: any) => ({
      id: parseInt(item['@_id']),
      name: item.name['@_value'],
      yearPublished: item.yearpublished ? parseInt(item.yearpublished['@_value']) : 0,
    }))

    // Cache the results
    cache.set(cacheKey, results, SEARCH_CACHE_TTL)
    console.log(`Cached search results for "${query}" (${results.length} results)`)
    
    return results
  } catch (error) {
    console.error('BGG search error:', error)
    throw error
  }
}

export async function getBGGGame(id: number): Promise<BGGGame | null> {
  // Check cache first
  const cacheKey = `bgg:game:${id}`
  const cached = cache.get<BGGGame>(cacheKey)
  if (cached) {
    console.log('Returning cached game details for ID:', id)
    return cached
  }

  try {
    console.log('Fetching BGG game from API:', id)
    
    await delay(1000) // Rate limiting
    
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${BGG_API_TOKEN}`,
        'Accept': 'application/xml',
      },
    })
    
    if (!response.ok) {
      const text = await response.text()
      console.error('BGG error response:', text)
      throw new Error(`BGG returned ${response.status}`)
    }
    
    const xml = await response.text()
    const result = parser.parse(xml)
    
    if (!result.items?.item) {
      return null
    }
    
    const item = result.items.item
    
    // Find primary name
    const names = Array.isArray(item.name) ? item.name : [item.name]
    const primaryName = names.find((n: any) => n['@_type'] === 'primary')
    
    const game: BGGGame = {
      id,
      name: primaryName['@_value'],
      image: item.image || '',
      minPlayers: parseInt(item.minplayers['@_value']),
      maxPlayers: parseInt(item.maxplayers['@_value']),
      playingTime: parseInt(item.playingtime['@_value']),
      yearPublished: parseInt(item.yearpublished['@_value']),
      averageWeight: parseFloat(item.statistics.ratings.averageweight['@_value']),
      description: item.description || '',
    }

    // Cache the game details
    cache.set(cacheKey, game, GAME_CACHE_TTL)
    console.log(`Cached game details for "${game.name}" (ID: ${id})`)
    
    return game
  } catch (error) {
    console.error('BGG fetch error:', error)
    throw error
  }
}