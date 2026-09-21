import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { outingId } = await req.json()

    if (!outingId) {
      return new Response(JSON.stringify({ error: 'ID de sortie manquant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get outing details
    const { data: outing, error: outingError } = await supabase
      .from('outings')
      .select(`
        *,
        venue_bottle_prices!inner (
          bottle_id,
          price,
          bottles (
            id,
            name,
            rarity_tier,
            base_xp
          )
        )
      `)
      .eq('id', outingId)
      .single()

    if (outingError || !outing) {
      return new Response(JSON.stringify({ error: 'Sortie non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get outing bottles
    const { data: outingBottles } = await supabase
      .from('outing_bottles')
      .select(`
        quantity,
        bottles (
          id,
          name,
          rarity_tier,
          base_xp
        )
      `)
      .eq('outing_id', outingId)

    if (!outingBottles) {
      return new Response(JSON.stringify({ error: 'Aucune bouteille trouvée' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Calculate total price
    let totalPrice = 0
    const bottleData = outingBottles.map((ob: any) => {
      const venuePrice = outing.venue_bottle_prices.find(
        (vp: any) => vp.bottle_id === ob.bottles.id
      )
      const unitPrice = venuePrice?.price || 0
      totalPrice += unitPrice * ob.quantity

      return {
        id: ob.bottles.id,
        name: ob.bottles.name,
        rarity: ob.bottles.rarity_tier,
        baseXp: ob.bottles.base_xp,
        quantity: ob.quantity,
      }
    })

    // Get current user XP and cards
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', outing.owner_id)
      .single()

    const { data: existingCards } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', outing.owner_id)

    // Create cards map
    const cardsMap = new Map(
      existingCards?.map((card: any) => [card.bottle_id, card.quantity]) || []
    )

    // Calculate gamification
    let totalXpGained = 0
    const cardsObtained: any[] = []

    for (const bottle of bottleData) {
      const xpGained = bottle.baseXp * bottle.quantity
      totalXpGained += xpGained

      const existingQuantity = cardsMap.get(bottle.id) || 0
      const isNew = existingQuantity === 0
      const newQuantity = existingQuantity + bottle.quantity

      cardsObtained.push({
        bottleId: bottle.id,
        bottleName: bottle.name,
        rarity: bottle.rarity,
        isNew,
        quantity: newQuantity,
      })
    }

    const newXp = (profile?.xp || 0) + totalXpGained
    const oldLevel = 1 + Math.floor(Math.sqrt((profile?.xp || 0) / 100))
    const newLevel = 1 + Math.floor(Math.sqrt(newXp / 100))
    const levelUp = newLevel > oldLevel

    // Update profile XP
    await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', outing.owner_id)

    // Update or insert cards
    for (const card of cardsObtained) {
      const existingCard = existingCards?.find(
        (c: any) => c.bottle_id === card.bottleId
      )

      if (existingCard) {
        await supabase
          .from('cards')
          .update({ quantity: card.quantity })
          .eq('id', existingCard.id)
      } else {
        await supabase.from('cards').insert({
          user_id: outing.owner_id,
          bottle_id: card.bottleId,
          quantity: card.quantity,
        })
      }
    }

    // Update outing total price
    await supabase
      .from('outings')
      .update({ total_price: totalPrice })
      .eq('id', outingId)

    return new Response(JSON.stringify({
      success: true,
      newXp,
      newLevel,
      levelUp,
      cardsObtained,
      totalPrice,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
