# Bitsy Game Data Format Specification

A comprehensive guide to the Bitsy game data format (version 8.14).

## Overview

Bitsy is a tiny game engine for making small games, worlds, and stories. Games are stored as plain text files with a specific structure. This document describes the complete format.

## File Structure

A Bitsy game file consists of these sections in order:

1. **Header** - Game title and version info
2. **Palettes** - Color definitions
3. **Rooms** - Game world layout
4. **Tiles** - 8x8 tile graphics
5. **Sprites** - Player and NPC graphics
6. **Items** - Collectible object graphics
7. **Dialogs** - Text content
8. **Variables** - Game state storage
9. **Tunes** - Background music
10. **Blips** - Sound effects

---

## Header

The header contains the game title and version metadata.

```
My Game Title
# BITSY VERSION 8.14
! VER_MAJ 8
! VER_MIN 14
! ROOM_FORMAT 1
! DLG_COMPAT 0
! TXT_MODE 0
```

| Field | Description |
|-------|-------------|
| Line 1 | Game title (plain text, no prefix) |
| `# BITSY VERSION` | Version comment (informational) |
| `! VER_MAJ` | Major version number |
| `! VER_MIN` | Minor version number |
| `! ROOM_FORMAT` | Room format version (1 = current) |
| `! DLG_COMPAT` | Dialog compatibility mode (0 = off) |
| `! TXT_MODE` | Text mode (0 = default) |

---

## Palettes (PAL)

Palettes define the colors used in the game. Each palette has exactly 3 colors.

```
PAL <id>
<r>,<g>,<b>
<r>,<g>,<b>
<r>,<g>,<b>
NAME <name>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `PAL <id>` | Yes | Palette identifier (0-9, then a-z) |
| RGB line 1 | Yes | Background color (0-255 per channel) |
| RGB line 2 | Yes | Tile color |
| RGB line 3 | Yes | Sprite/Item color |
| `NAME <name>` | No | Human-readable name |

### Example

```
PAL 0
0,82,204
128,159,255
255,255,255
NAME blueprint
```

### Color Indexing

When assigning colors to tiles/sprites/items, use the `COL` property:
- `COL 0` = Background color
- `COL 1` = Tile color
- `COL 2` = Sprite/Item color

---

## Rooms (ROOM)

Rooms are 16x16 grids that define the game world layout.

```
ROOM <id>
<row 0: 16 comma-separated tile IDs>
<row 1>
...
<row 15>
NAME <name>
ITM <item_id> <x>,<y>
EXT <x>,<y> <dest_room> <dest_x>,<dest_y>
END <dlg_id> <x>,<y>
PAL <palette_id>
TUNE <tune_id>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `ROOM <id>` | Yes | Room identifier |
| Grid data | Yes | 16 rows of 16 tile IDs (comma-separated) |
| `NAME <name>` | No | Human-readable name |
| `ITM <id> <x>,<y>` | No | Place item at position (can have multiple) |
| `EXT <x>,<y> <room> <dest_x>,<dest_y>` | No | Exit to another room |
| `END <dlg_id> <x>,<y>` | No | Game ending trigger |
| `PAL <palette_id>` | No | Palette to use (default: 0) |
| `TUNE <tune_id>` | No | Background music |

### Example

```
ROOM 0
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
0,a,a,a,a,a,a,a,a,a,a,a,a,a,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,a,a,a,a,a,a,a,a,a,a,a,a,a,0
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
NAME example room
ITM 0 10,10
ITM 1 11,6
EXT 2,2 0 13,13
EXT 13,13 0 2,2
END 3 10,3
PAL 0
TUNE 2
```

### Tile ID Reference

- `0` = Empty space (walkable)
- `a`, `b`, `c`... = Tile graphics defined in TIL blocks

---

## Tiles (TIL)

Tiles are 8x8 pixel graphics used to build room environments.

```
TIL <id>
<row 0: 8 binary digits>
<row 1>
...
<row 7>
NAME <name>
WAL true
COL <color_index>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `TIL <id>` | Yes | Tile identifier (a-z, or numbers) |
| Pixel data | Yes | 8 rows of 8 binary digits (0/1) |
| `NAME <name>` | No | Human-readable name |
| `WAL true` | No | Makes tile solid/impassable |
| `COL <n>` | No | Palette color index (0-2) |

### Pixel Data Format

Each row is 8 characters: `0` = background color, `1` = tile color.

```
TIL a
11111111
10000001
10000001
10011001
10011001
10000001
10000001
11111111
NAME block
```

Visual representation:
```
████████
█      █
█      █
█  ██  █
█  ██  █
█      █
█      █
████████
```

---

## Sprites (SPR)

Sprites are animated 8x8 characters. Sprite `A` is always the player avatar.

```
SPR <id>
<frame 1: 8 rows of 8 binary digits>
>
<frame 2: 8 rows of 8 binary digits>
NAME <name>
DLG <dialog_id>
POS <room_id> <x>,<y>
BLIP <blip_id>
COL <color_index>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `SPR <id>` | Yes | Sprite identifier (`A` = player) |
| Frame 1 data | Yes | 8 rows of 8 binary digits |
| `>` | No | Frame separator (for animation) |
| Frame 2 data | No | Second animation frame |
| `NAME <name>` | No | Human-readable name |
| `DLG <dialog_id>` | No | Dialog triggered on interaction |
| `POS <room> <x>,<y>` | Yes* | Position (*required for non-player) |
| `BLIP <blip_id>` | No | Sound effect on interaction |
| `COL <n>` | No | Palette color index |

### Example: Player Avatar

```
SPR A
00011000
00011000
00011000
00111100
01111110
10111101
00100100
00100100
>
00000000
00011000
00011000
00011000
00111100
01111110
10100101
00100100
POS 0 4,4
```

### Example: NPC Sprite

```
SPR a
00000000
00000000
01010001
01110001
01110010
01111100
00111100
00100100
>
00000000
00000000
10001000
01110000
01110011
01111101
00111100
00100100
NAME cat
DLG 0
POS 0 8,12
BLIP 1
```

---

## Items (ITM)

Items are collectible 8x8 objects that disappear when touched.

```
ITM <id>
<8 rows of 8 binary digits>
NAME <name>
DLG <dialog_id>
BLIP <blip_id>
COL <color_index>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `ITM <id>` | Yes | Item identifier |
| Pixel data | Yes | 8 rows of 8 binary digits |
| `NAME <name>` | No | Human-readable name |
| `DLG <dialog_id>` | No | Dialog shown when collected |
| `BLIP <blip_id>` | No | Sound effect when collected |
| `COL <n>` | No | Palette color index |

### Example

```
ITM 0
00000000
00000000
00000000
00111100
01100100
00100100
00011000
00000000
NAME tea
DLG 1

ITM 1
00000000
00111100
00100100
00111100
00010000
00011000
00010000
00011000
NAME key
DLG 2
BLIP 2
```

**Note:** Items are placed in rooms using the `ITM <id> <x>,<y>` line in ROOM blocks.

---

## Dialogs (DLG)

Dialogs contain text displayed during interactions.

```
DLG <id>
<text content>
NAME <name>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `DLG <id>` | Yes | Dialog identifier |
| Text content | Yes | Dialog text (can span multiple lines) |
| `NAME <name>` | No | Human-readable name |

### Example

```
DLG 0
I'm a cat
NAME cat dialog

DLG 1
You found a nice warm cup of tea
NAME tea dialog

DLG 2
A key! {wvy}What does it open?{wvy}
NAME key dialog
```

### Text Effects

Dialog text supports special effects using curly braces:

| Effect | Description |
|--------|-------------|
| `{wvy}text{wvy}` | Wavy animated text |
| `{shk}text{shk}` | Shaking text |
| `{rbw}text{rbw}` | Rainbow colored text |
| `{clr1}text{clr1}` | Color 1 (palette index) |
| `{clr2}text{clr2}` | Color 2 (palette index) |
| `{clr3}text{clr3}` | Color 3 (palette index) |

### Conditional/Scripting

Dialogs support conditional logic:

```
{if var eq value}
  text when true
{else}
  text when false
{end}
```

---

## Variables (VAR)

Variables store game state.

```
VAR <name>
<value>
```

### Example

```
VAR a
42

VAR player_name
Hero
```

Variables can be used in dialog conditions and modified via dialog scripting.

---

## Tunes (TUNE)

Tunes are background music composed of multiple bars.

```
TUNE <id>
<bar 1 melody notes>
<bar 1 harmony notes>
>
<bar 2 melody notes>
<bar 2 harmony notes>
>
...
NAME <name>
KEY <note_mapping>
TMP <tempo>
SQR <settings>
ARP <settings>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `TUNE <id>` | Yes | Tune identifier |
| Note data | Yes | Comma-separated notes per bar |
| `>` | Yes | Bar separator |
| `NAME <name>` | No | Human-readable name |
| `KEY <mapping>` | No | Note letter mapping |
| `TMP <tempo>` | No | Tempo: XFST, FST, MED, SLW, XSLW |
| `SQR <settings>` | No | Square wave pulse widths |
| `ARP <settings>` | No | Arpeggio settings |

### Tempo Values

| Value | Description |
|-------|-------------|
| `XFST` | Extra fast |
| `FST` | Fast |
| `MED` | Medium |
| `SLW` | Slow |
| `XSLW` | Extra slow |

### Note Format

Notes follow the pattern: `[duration][note][octave]`

- Duration prefix: `2` = half, `3` = triplet, `4` = quarter, `8` = eighth, `16` = sixteenth
- Notes: `C`, `C#`/`Db`, `D`, `D#`/`Eb`, `E`, `F`, `F#`/`Gb`, `G`, `G#`/`Ab`, `A`, `A#`/`Bb`, `B`
- Octave: `2`-`6` (default: 4)
- `0` = Rest/silence

### Example

```
TUNE 1
3d,0,0,0,3d5,0,0,0,3l,0,0,0,3s,0,0,0
16d2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
>
4l,0,0,0,s,0,3l,0,0,0,2s,0,2m,0,2r,0
16m2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
NAME finale fanfare
KEY C,D,E,F,G,A,B d,r,m,s,l
TMP XFST
SQR P2 P8
ARP INT8
```

### KEY Mapping

Custom key mapping for solfege or alternative note names:
```
KEY C,D,E,F,G,A,B d,r,m,s,l
```

### SQR Settings

Square wave pulse width settings for melody and harmony:
- `P2` = 12.5% pulse
- `P4` = 25% pulse
- `P8` = 50% pulse (square)

Example: `SQR P4 P2` (melody P4, harmony P2)

---

## Blips (BLIP)

Blips are short sound effects.

```
BLIP <id>
<note_data>
NAME <name>
ENV <attack> <decay> <sustain> <release> <volume>
BEAT <rate> <delay>
SQR <pulse_width>
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `BLIP <id>` | Yes | Blip identifier |
| Note data | Yes | Comma-separated notes |
| `NAME <name>` | No | Human-readable name |
| `ENV <params>` | No | Envelope: attack, decay, sustain, release, volume |
| `BEAT <params>` | No | Beat timing parameters |
| `SQR <setting>` | No | Pulse width (P2, P4, P8) |

### Example

```
BLIP 1
E5,B5,B5
NAME meow
ENV 40 99 4 185 138
BEAT 61 115
SQR P2

BLIP 2
D5,E5,D5
NAME pick up key
ENV 99 65 6 96 152
BEAT 95 0
SQR P4
```

---

## Endings (END)

Endings are game-over states defined in rooms and use dialogs for their text.

### In Room Definition

```
END <dlg_id> <x>,<y>
```

When the player walks to position `<x>,<y>`, the ending dialog is triggered.

### Dialog Content

The ending text is stored in a regular DLG block:

```
DLG 3
The end
NAME ending 1
```

---

## Complete Example

Here's a minimal complete Bitsy game:

```
My First Bitsy Game

# BITSY VERSION 8.14
! VER_MAJ 8
! VER_MIN 14
! ROOM_FORMAT 1
! DLG_COMPAT 0
! TXT_MODE 0

PAL 0
0,82,204
128,159,255
255,255,255
NAME blueprint

ROOM 0
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
0,a,a,a,a,a,a,a,a,a,a,a,a,a,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,0,0,0,0,0,0,0,0,0,0,0,0,a,0
0,a,a,a,a,a,a,a,a,a,a,a,a,a,a,0
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
NAME starting room
ITM 0 10,10
END 1 8,4
PAL 0

TIL a
11111111
10000001
10000001
10011001
10011001
10000001
10000001
11111111
NAME wall
WAL true

SPR A
00011000
00011000
00011000
00111100
01111110
10111101
00100100
00100100
POS 0 4,4

ITM 0
00011000
00111100
01111110
11111111
01100110
00100100
00011000
00000000
NAME star
DLG 0

DLG 0
You found a star!
NAME star dialog

DLG 1
Congratulations! You win!
NAME ending

VAR score
0
```

---

## ID Conventions

| Type | ID Format | Notes |
|------|-----------|-------|
| Palettes | 0-9, then a-z | Max ~36 palettes |
| Rooms | 0, 1, 2... | Numeric IDs |
| Tiles | a, b, c... | Lowercase letters preferred |
| Sprites | A (player), a, b... | A is always player avatar |
| Items | 0, 1, 2... | Numeric IDs |
| Dialogs | 0, 1, 2... | Numeric IDs |
| Tunes | 0, 1, 2... | Numeric IDs |
| Blips | 0, 1, 2... | Numeric IDs |

---

## Sources

- [Bitsy Official Site](https://www.bitsy.org/)
- [Bitsy by Adam Le Doux on itch.io](https://ledoux.itch.io/bitsy)
- [Bitsy GitHub Repository](https://github.com/le-doux/bitsy)
- [Bitsy Docs](https://make.bitsy.org/docs/)
- [BitsyDO Dataset](https://github.com/amidos2006/BitsyDO)
