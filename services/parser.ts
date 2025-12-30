import { Recipe, Ingredient } from '../types';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const UNIT_REGEX = /([\d.,]+)\s*(ml|cl|oz|dash|dashes|tsp|tbsp|drop|drops|bottle|can|slice|wedge|twist)\s+(.*)/i;

export const parseRecipeMarkdown = (md: string): Recipe[] => {
  const recipes: Recipe[] = [];
  const lines = md.split('\n');
  
  let currentRecipe: Partial<Recipe> = {};
  let isParsingIngredients = false;
  let isParsingGarnish = false;
  let bufferInstructions = [];

  const finalizeRecipe = () => {
    if (currentRecipe.title) {
      recipes.push({
        id: generateId(),
        title: currentRecipe.title || 'Untitled',
        ingredients: currentRecipe.ingredients || [],
        instructions: currentRecipe.instructions || bufferInstructions.join('\n').trim(),
        garnish: currentRecipe.garnish,
        tags: currentRecipe.tags || [],
        credits: currentRecipe.credits,
        glassware: currentRecipe.glassware || 'Highball', // Default
        addedAt: Date.now(),
        rating: 0
      });
    }
    currentRecipe = {};
    bufferInstructions = [];
    isParsingIngredients = false;
    isParsingGarnish = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Title
    if (line.startsWith('# ')) {
      if (currentRecipe.title) finalizeRecipe();
      currentRecipe.title = line.substring(2).trim();
      currentRecipe.ingredients = [];
      currentRecipe.tags = [];
      isParsingIngredients = true;
      continue;
    }

    // Section Header (Garnish)
    if (line.startsWith('## Garnish')) {
      isParsingIngredients = false;
      isParsingGarnish = true;
      continue;
    }

    // Instructions block quote
    if (line.startsWith('>')) {
      isParsingIngredients = false;
      isParsingGarnish = false;
      bufferInstructions.push(line.substring(1).trim());
      continue;
    }

    // Ingredient Line
    if (isParsingIngredients && line.startsWith('-')) {
      const content = line.substring(1).trim();
      const match = content.match(UNIT_REGEX);
      
      let ingredient: Ingredient;
      
      if (match) {
        let amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toLowerCase();
        const name = match[3];

        // Normalizing to ML
        let amountMl = amount;
        if (unit === 'oz') amountMl = amount * 29.5735;
        if (unit === 'cl') amountMl = amount * 10;
        if (unit.startsWith('dash')) amountMl = amount * 0.8; // Rough est
        
        ingredient = {
          amount: parseFloat(amountMl.toFixed(1)),
          unit: 'ml', // Store internally as ml usually, but keeping original unit is also fine. Let's strict to ML for this app as requested.
          name: name,
          originalText: content
        };
      } else {
        // Fallback for items without clear units (e.g. "1 Lime")
        // Try to parse number at start
        const numberMatch = content.match(/^([\d.,]+)\s+(.*)/);
        if (numberMatch) {
            ingredient = {
                amount: parseFloat(numberMatch[1].replace(',', '.')),
                unit: 'pcs',
                name: numberMatch[2],
                originalText: content
            }
        } else {
             ingredient = {
                amount: 0,
                unit: 'text',
                name: content,
                originalText: content
            };
        }
      }
      currentRecipe.ingredients?.push(ingredient);
      continue;
    }

    // Garnish Line
    if (isParsingGarnish) {
      currentRecipe.garnish = (currentRecipe.garnish ? currentRecipe.garnish + ', ' : '') + line;
      continue;
    }

    // Tags
    if (line.includes('#') && !line.startsWith('# ')) {
      const tags = line.match(/#[\w-]+/g);
      if (tags) {
        currentRecipe.tags = [...(currentRecipe.tags || []), ...tags.map(t => t.substring(1))];
      }
      continue;
    }
    
    // Credits
    if (line.startsWith('`') && line.endsWith('`')) {
        currentRecipe.credits = line.replace(/`/g, '');
    }
  }

  if (currentRecipe.title) finalizeRecipe();

  return recipes;
};