# Bitsy Design Patterns & Best Practices

Common patterns and techniques used by experienced Bitsy authors.

---

## Critical Rules

### Never Delete Room 0

Room 0 is the initial starting room. Deleting it causes serious malfunctions.

**Best practice:** Label Room 0 as "Do not delete" and leave it unused if you want a different starting area. You can place exits in Room 0 that immediately teleport the player elsewhere.

### Don't Edit While Testing

If you edit your game while running it in play mode, changes can be lost when you stop testing.

**Best practice:** Always stop the test run before making edits.

### Save Frequently

The Bitsy editor runs in-browser. Browser crashes, accidental navigation, or closing the tab will lose your work.

**Best practice:** Download your game file regularly. Keep versioned backups.

---

## Visual Design Patterns

### Invisible Sprite Placeholders

Sprites and items that should be invisible at runtime (e.g., trigger zones) are hard to track in the editor.

**Pattern:** Draw a distinctive placeholder graphic (like an "X" or bright pattern) while editing. Change it to blank before publishing, or use a hack to hide it at runtime.

```
SPR b
11111111
10000001
10100101
10011001
10011001
10100101
10000001
11111111
NAME invisible trigger (PLACEHOLDER)
```

### Avatar Hiding

To make the player avatar invisible (for cutscenes, title screens, etc.):

**Pattern:** Set the avatar's color to match the background color.

```
SPR A
00011000
00011000
00111100
01111110
00100100
00100100
00000000
00000000
COL 0
```

With `COL 0`, the avatar renders in the background color, making it invisible.

### Exit/Ending Markers

Exits and endings are invisible mechanics (see format doc).

**Pattern:** Always place a visual tile at exit/ending locations:
- Doors for room transitions
- Stairs for vertical movement
- Portals for magical transportation
- Treasure chests or goal markers for endings

---

## Dialog Patterns

### Boolean Logic Workarounds

Bitsy conditionals can only evaluate one variable at a time. Use math to simulate boolean logic.

**AND pattern:** Multiply variables (both must be 1)
```
{if hasKey * hasTorch == 1}
  You have both items!
{end}
```

**OR pattern:** Add variables (either can be 1+)
```
{if hasKey + hasTorch >= 1}
  You have at least one item!
{end}
```

**Initialization:** Set boolean variables to 0 at game start:
```
VAR hasKey
0

VAR hasTorch
0
```

### Counting Items

Track collected items with a counter variable.

**Pattern:**
```
DLG coin_pickup
You found a coin!
{coins = coins + 1}
You now have {coins} coins.
```

### Branching Dialog Based on State

Create different responses based on game progress.

**Pattern:**
```
DLG guard
{if hasPass == 1}
  Welcome back. You may enter.
{else}
  Halt! You need a pass to enter.
{end}
```

### One-Time Events

Prevent dialog or events from repeating.

**Pattern:**
```
DLG treasure_chest
{if chestOpened == 0}
  You found a golden key!
  {chestOpened = 1}
  {hasKey = 1}
{else}
  The chest is empty.
{end}
```

---

## Room Design Patterns

### Border Walls

Surround rooms with wall tiles to keep the player contained.

**Pattern:**
```
ROOM 0
a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a
a,0,0,0,0,0,0,0,0,0,0,0,0,0,0,a
a,0,0,0,0,0,0,0,0,0,0,0,0,0,0,a
...
a,0,0,0,0,0,0,0,0,0,0,0,0,0,0,a
a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a
```

### Symmetrical Exits

When connecting two rooms, place exits at logical mirror positions.

**Pattern:** If Room 0 has an exit on the right edge leading to Room 1, Room 1 should have an exit on the left edge leading back.

```
# In Room 0 (exit on right)
EXT 15,8 1 1,8

# In Room 1 (exit on left)
EXT 0,8 0 14,8
```

### Hub Room Design

For larger games, use a central hub room that connects to multiple areas.

**Pattern:**
- Place the hub in the center of your room layout
- Use distinct visual themes for each exit (forest door, cave entrance, castle gate)
- Consider placing a guide NPC in the hub

---

## Variable Naming Conventions

### Boolean Flags
Use descriptive names starting with `has`, `is`, or `did`:
```
VAR hasKey
VAR isDoorsUnlocked
VAR didTalkToGuard
```

### Counters
Use plural nouns:
```
VAR coins
VAR gems
VAR stepsWalked
```

### State Tracking
Use descriptive state names:
```
VAR currentQuest
VAR playerLocation
```

---

## Palette Patterns

### Room-Specific Palettes

Use different palettes to create distinct atmospheres.

**Pattern:**
- Forest rooms: Greens and browns
- Cave rooms: Dark grays and blues
- Indoor rooms: Warm yellows and oranges

```
PAL forest
34,139,34
139,90,43
255,255,200

PAL cave
20,20,40
60,60,80
150,150,170
```

### Consistent Color Meaning

Keep color meanings consistent across palettes.

**Pattern:**
- Color 0: Always background
- Color 1: Always solid/environmental
- Color 2: Always interactive (sprites, items)

---

## Sources

- [Shimmerwitch's Bitsy Tutorial](https://www.shimmerwitch.space/bitsyTutorial.html)
- [Bitsy Variables Tutorial](https://ayolland.itch.io/trevor/devlog/29520/bitsy-variables-a-tutorial)
- [Boolean Operations in Bitsy](https://louisemclennan.wordpress.com/2018/06/07/boolean-operations-in-bitsy/)
- [Bitsy Hacks](https://seleb.github.io/bitsy-hacks/)
- [Ripple's Bitsy Guide](https://ripplewrites.neocities.org/bitsyguide)
