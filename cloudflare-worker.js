export default {
  async fetch(req, env) {
    try {
      if (req.method !== "POST") {
        return new Response("Only POST allowed", { status: 405 });
      }

      const { image_url } = await req.json();
      if (!image_url) {
        return new Response(JSON.stringify({ error: "image_url required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const categoryImages = {
        "חלבון": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984933/steak_mlurou.webp",
        "פחמימה": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984890/bread-slice_dxwpxq.webp",
        "שומן": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984882/avocado_2_brovfe.webp",
        "ירק": "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921406/broccoli_6_esjw1f.webp",
        "פרי": "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921407/apple_3_r7sndm.webp",
        "לא מוגדר": "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921406/broccoli_6_esjw1f.webp",
      };

      // First AI call: Get plate description
      const descriptionPrompt = 
        "תאר במשפט אחד קצר בעברית מה יש בצלחת הזו. " +
        "למשל: 'צלחת עם אורז, חזה עוף וירקות' או 'ארוחת בוקר עם ביצים וסלט'. " +
        "רק משפט אחד קצר ופשוט.";

      const descResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: descriptionPrompt },
                { type: "image_url", image_url: { url: image_url } },
              ],
            },
          ],
        }),
      });

      const descData = await descResp.json();
      const description = descData.choices?.[0]?.message?.content || "";

      // Second AI call: Analyze food items
      const aiPrompt =
        "You receive a photo of a plate of food. " +
        "Important: ALL nutritional values must be for COOKED/PREPARED food, not raw. " +
        "For example: cooked rice (130 cal/100g), cooked chicken breast (165 cal/100g), cooked vegetables. " +
        "Use visual cues like utensils, plate size, and portion perspective to estimate realistic serving sizes. " +
        "Step 1: Identify all foods visible on the plate. " +
        "Step 2: For each food, estimate grams based on visual portion size (considering the food is cooked). " +
        "Step 3: Determine the primary category: חלבון (protein-rich), פחמימה (carb-rich), שומן (fat-rich), ירק (vegetable), or פרי (fruit). " +
        "Step 4: Calculate calories, protein_grams, carb_grams, and fat_grams using COOKED nutritional values. " +
        "Output only valid JSON array of objects. " +
        "Each object must include: name (Hebrew), grams, calories, protein_grams, carb_grams, fat_grams, category. " +
        "All values must be numeric and realistic for typical cooked portions.";

      const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: aiPrompt },
                { type: "image_url", image_url: { url: image_url } },
              ],
            },
          ],
        }),
      });

      const aiData = await aiResp.json();
      const raw = aiData.choices?.[0]?.message?.content || "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let detectedFoods = [];
      try {
        detectedFoods = JSON.parse(cleaned);
      } catch {
        detectedFoods = [];
      }

      const enriched = detectedFoods.slice(0, 6).map((item) => {
        const grams = item.grams || 0;
        const protein_grams = item.protein_grams || 0;
        const carb_grams = item.carb_grams || 0;
        const fat_grams = item.fat_grams || 0;
        const calories = item.calories || 0;
        const category = item.category || "לא מוגדר";

        // Calculate portions based on the serving definitions
        // Protein portion: 200 calories of protein-rich food
        // Carb portion: 120 calories of carb-rich food
        // Fat portion: 120 calories of fat-rich food
        // For vegetables and fruits, we use their calorie counts directly

        let protein_portions = 0;
        let carb_portions = 0;
        let fat_portions = 0;
        let veg_portions = 0;
        let fruit_portions = 0;

        if (category === "ירק") {
          veg_portions = Math.round((calories / 35) * 2) / 2;
        } else if (category === "פרי") {
          fruit_portions = Math.round((calories / 85) * 2) / 2;
        } else {
          // For mixed foods, determine which macro is dominant
          const proteinCals = protein_grams * 4;
          const carbCals = carb_grams * 4;
          const fatCals = fat_grams * 9;
          const total = proteinCals + carbCals + fatCals;

          if (total > 0) {
            const proteinPct = proteinCals / total;
            const carbPct = carbCals / total;
            const fatPct = fatCals / total;

            // Distribute calories to portions based on macro dominance
            if (category === "חלבון") {
              protein_portions = Math.round((calories / 200) * 2) / 2;
            } else if (category === "פחמימה") {
              carb_portions = Math.round((calories / 120) * 2) / 2;
            } else if (category === "שומן") {
              fat_portions = Math.round((calories / 120) * 2) / 2;
            } else {
              // For "לא מוגדר", split based on macros
              protein_portions = Math.round(((proteinCals / 200) * 2) / 2);
              carb_portions = Math.round(((carbCals / 120) * 2) / 2);
              fat_portions = Math.round(((fatCals / 120) * 2) / 2);
            }
          }
        }

        return {
          name: item.name,
          grams,
          calories,
          protein_grams,
          carb_grams,
          fat_grams,
          protein_portions,
          carb_portions,
          fat_portions,
          veg_portions,
          fruit_portions,
          category,
          category_image_url: categoryImages[category] || categoryImages["לא מוגדר"],
        };
      });

      const response = {
        description: description.trim(),
      };
      
      for (let i = 0; i < 6; i++) {
        response[`item${i}`] = enriched[i] || null;
      }

      return new Response(JSON.stringify(response, null, 2), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
