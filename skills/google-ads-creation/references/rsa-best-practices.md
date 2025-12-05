# Google Ads Responsive Search Ads Best Practices

## Character Limits (CRITICAL)

### Headlines
- **Maximum**: 30 characters (including spaces)
- **Minimum required**: 3 headlines
- **Maximum allowed**: 15 headlines
- **Note**: Keyword insertion operators like `{KeyWord:Default}` do NOT count toward character limit - only the default text inside counts

### Descriptions
- **Maximum**: 90 characters (including spaces)
- **Minimum required**: 2 descriptions
- **Maximum allowed**: 4 descriptions
- **Note**: Keyword insertion operators like `{KeyWord:Default}` do NOT count toward character limit - only the default text inside counts

### Paths
- **Maximum**: 15 characters each (including spaces)
- **Number**: 2 paths
- **Purpose**: Display in the ad URL (e.g., domain.com/Path1/Path2)

### Dynamic Text Insertion Character Counting

**Important**: When using `{KeyWord:Default Text}`, `{LOCATION(City):Default}`, or other dynamic operators:
- The curly braces `{}` and operator text (KeyWord:, LOCATION(City):) DO NOT count toward character limit
- ONLY the default text counts toward the limit

**Examples**:
- `{KeyWord:Treadmill Sale}` = 14 characters (only "Treadmill Sale" counts)
- `{KeyWord:Yoga}` = 4 characters (only "Yoga" counts)
- `{LOCATION(City):Zurich}` = 6 characters (only "Zurich" counts)
- `Only {KeyWord:Fitness}` = 12 characters (5 for "Only " + 7 for "Fitness")

## RSA Writing Principles

### 1. Headline Strategy

**Diversity is Key**: RSAs perform best with varied headlines that cover different angles. Aim for 2-3 headlines from each category:

**Content-Based Categories:**
- **Price/Offer headlines**: Include pricing, rates, or promotional info
- **Brand/Trust headlines**: Mention company name, ratings, or credibility markers
- **Feature headlines**: Highlight specific features or product details
- **Benefit headlines**: Focus on customer advantages
- **CTA headlines**: Direct calls-to-action
- **Location headlines**: Geographic targeting (with dynamic insertion)
- **Keyword-focused headlines**: Use dynamic keyword insertion strategically

**Persuasion-Based Styles** (for creative variety):
- **Scarcity/Urgency**: Time limits, stock levels, exclusivity ("Only 3 Left", "Ends Friday")
- **Intriguing Hook**: Spark curiosity without revealing everything ("The Secret to...", "What Most Miss")
- **Identity-Based**: Appeal to self-image ("For Serious Athletes", "Built for Pros")
- **Emotional Benefit**: Focus on feelings, not just outcomes ("Feel Confident", "Sleep Easy")
- **Sensory Language**: Vivid, tangible descriptions ("Buttery Soft Leather", "Crystal Clear")
- **Reason Why**: Explain the offer/claim ("Why We're #1", "How We Cut Costs 40%")
- **Story-Trigger**: Hint at a narrative ("From Garage to Global", "10 Years in the Making")
- **Professional Endorsement**: Expert/authority backing ("Dentist Recommended", "Chef's Choice")

**Best Practices**:
- ✓ Use at least 8-10 strong, unique headlines (up to 15 allowed)
- ✓ Make each headline independently meaningful
- ✓ Include numbers, prices, or statistics when relevant
- ✓ Use action verbs (Discover, Get, Find, Compare, Save, Buy)
- ✓ Add urgency or scarcity when appropriate (Limited, Today, Now)
- ✓ Test different headline lengths (mix short punchy and longer descriptive)
- ✓ Use keyword insertion strategically (2-3 headlines typically)

**Avoid**:
- ✗ Repetitive headlines that say the same thing
- ✗ Headlines that only make sense together (each must work independently)
- ✗ Generic statements without specific value
- ✗ Excessive keyword stuffing
- ✗ All headlines being the same length or style

### 2. Description Strategy

**Complementary Messaging**: Descriptions should work together but also independently:
- Each description should be complete and valuable on its own
- Google shows 1-2 descriptions at a time, not all 4
- Vary the focus across descriptions (features, benefits, process, trust signals)

**Best Practices**:
- ✓ Use all 4 description slots available
- ✓ Front-load key information (first 30-40 characters matter most)
- ✓ Include specific benefits and features
- ✓ Add social proof (ratings, reviews, testimonials)
- ✓ Clarify the value proposition
- ✓ Use natural, conversational language
- ✓ Include a soft call-to-action when appropriate

**Avoid**:
- ✗ Repeating headline information
- ✗ Generic marketing speak without substance
- ✗ Incomplete sentences or thoughts
- ✗ Excessive punctuation or ALL CAPS
- ✗ Misleading claims or exaggerations

### 3. Path Strategy

**URL Paths**: Display paths appear in the ad’s URL and should mimic the structure of a clean, logical website directory. They help users understand *where* the ad will take them.

**Best Practices**:
- Reflect the landing page topic (e.g., category → product type)
- Use simple, readable directory-style wording
- Keep paths short and descriptive
- Use proper capitalization (avoid all caps or all lowercase)
- Avoid generic filler terms that provide no context

**Examples**:
- Good: `fitness`,`equipment`, `gym`, `workout`, `treadmills`
- Avoid: `page`, `misc`, `category`, `here`

## Dynamic Text Insertion Best Practices

### Apple Iphoneword Insertion

**Use {KeyWord:Default} when**:
- Your ad groups are tightly themed around closely related search terms
- The default text still reads naturally if keyword insertion doesn’t trigger
- The inserted keyword fits grammatically into the headline or description
- The character limit allows room for the longest keyword in the ad group
- You want to improve ad relevance without compromising clarity or readability

**Common patterns**:
- `{KeyWord:Running Shoes} starting at X CHF`
- `Shop {KeyWord:Fitness Gear} Online`
- `{KeyWord:Workout Program} in {LOCATION(City):Country}`
- `Buy Your {KeyWord:Home Gym} Today`

**Avoid when**:
- Keywords are too varied in the ad group
- Insertion would create awkward phrasing
- Character limits are tight (keyword might exceed)
- The default text doesn't work well on its own

### Character Limit Management with Dynamic Insertion

**Strategy**: Calculate character count using ONLY the default text
- `{KeyWord:Apple Iphone}` counts as 13 characters
- Always ensure default text + surrounding text fits within limits
- The actual inserted keyword may be longer or shorter

## Content Extraction Strategy

When analyzing landing page content to generate RSAs:

### Priority Order
1. **Title Tag**: Main value proposition, primary keywords, brand positioning
2. **Meta Description**: Marketing copy, key benefits, call-to-action
3. **H1 Heading**: Primary page focus and main topic
4. **Page Content**: Detailed features, USPs, specifications, proof points

### What to Extract
- **Pricing information**: Specific prices, ranges, starting rates
- **Quantifiable metrics**: Number of options, inventory count, ratings
- **Key features**: Specific product/service attributes
- **Benefits**: Customer advantages and outcomes
- **Brand elements**: Company name, trust signals, differentiators
- **CTAs**: Action verbs and urgency indicators
- **Location info**: Geographic relevance
- **Social proof**: Ratings, reviews, customer numbers

### Tone and Voice Matching
- Analyze formality level (formal "Sie" vs. informal "du" in German)
- Match industry tone (luxury vs. budget, professional vs. casual)
- Preserve brand voice and messaging style
- Maintain consistency with landing page language

## Quality Standards

### Every RSA Must Include

**Headlines (minimum 10 recommended)**:
- [ ] At least 1 price/offer headline (if applicable)
- [ ] At least 1 brand/trust headline
- [ ] At least 2 feature/benefit headlines
- [ ] At least 1 CTA headline
- [ ] At least 1 keyword insertion headline (if appropriate)
- [ ] At least 1 location-targeted headline (if applicable)
- [ ] Mix of short (15-20 chars) and long (25-30 chars) headlines
- [ ] At least 2-3 persuasion styles used (urgency, hook, identity, emotional, etc.)

**Descriptions (use all 4)**:
- [ ] Each under 90 characters
- [ ] At least 1 focuses on benefits
- [ ] At least 1 includes features or process
- [ ] At least 1 contains social proof or trust signal
- [ ] Front-loaded with key information
- [ ] No repetition between descriptions

**Paths (both fields)**:
- [ ] Each under 15 characters
- [ ] Relevant to landing page
- [ ] Properly capitalized
- [ ] Descriptive and clear

### Character Validation
- [ ] All headlines ≤ 30 characters
- [ ] All descriptions ≤ 90 characters
- [ ] Both paths ≤ 15 characters
- [ ] Dynamic insertion defaults counted correctly
- [ ] No truncation or cutoff text

### Content Quality
- [ ] No duplicate headlines (each unique)
- [ ] Headlines work independently
- [ ] Descriptions work independently
- [ ] Grammar and spelling correct
- [ ] Tone matches landing page
- [ ] Accurate representation of offer
- [ ] No Google Ads policy violations

## Common Mistakes to Avoid

1. **Character counting errors**: Forgetting that `{KeyWord:Text}` only counts the default text
2. **Repetitive headlines**: Multiple headlines saying essentially the same thing
3. **Dependent messaging**: Headlines/descriptions that only make sense together
4. **Missing headline types**: Not covering diverse angles (price, brand, features, benefits, CTA)
5. **Generic descriptions**: Using vague language instead of specific benefits
6. **Incomplete thoughts**: Descriptions that feel cut off or unfinished
7. **Path waste**: Using generic paths like "home" or "page"
8. **Keyword stuffing**: Overusing dynamic insertion unnaturally
9. **Tone mismatch**: Not matching landing page formality/voice
10. **Under-utilizing slots**: Not using all 15 headline and 4 description opportunities

## Language-Specific Considerations

### German Language
- **Formal vs. Informal**: Match landing page (Sie vs. du)
- **Compound words**: Can be very long - may need shorter alternatives for headlines
- **Word order**: Maintain natural German sentence structure
- **Separable verbs**: Be mindful of verb placement in limited characters

### English Language
- **Contractions**: Generally acceptable for character efficiency
- **Title case vs. sentence case**: Remain consistent with brand style
- **US vs. UK spelling**: Match landing page locale

## Performance Optimization Tips

1. **Test variations**: Create 2 RSA variations per ad group for testing
2. **Pin strategically**: Only pin when absolutely necessary (reduces optimization)
3. **Monitor Asset Reports**: Review which headlines/descriptions perform best
4. **Refresh regularly**: Update ads quarterly with new headlines/descriptions
5. **A/B test messaging**: Try different value propositions and angles
6. **Use automation**: Let Google's machine learning find best combinations
7. **Quality over quantity**: 10 strong unique headlines > 15 mediocre ones
