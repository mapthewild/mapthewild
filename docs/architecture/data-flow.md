# Data Flow

## Content Flow (Build Time)

```mermaid
flowchart LR
    subgraph "Author"
        Write[Write MDX]
        Embed[Add Bracket Links]
    end

    subgraph "Build Process"
        Parse[Parse MDX]
        Transform[Transform Brackets]
        Generate[Generate HTML]
        Bundle[Bundle React]
    end

    subgraph "Output"
        Static[Static HTML]
        JS[React Hydration JS]
        Assets[Static Assets]
    end

    Write --> Embed
    Embed --> Parse
    Parse --> Transform
    Transform --> Generate
    Generate --> Static
    Generate --> JS
    Generate --> Assets
```

## User Interaction Flow (Runtime)

```mermaid
flowchart TB
    subgraph "User Actions"
        Read[Read Post]
        Click[Click Bracket Link]
        Hover[Hover Link]
        Nav[Navigate Panes]
    end

    subgraph "UI Response"
        Preview[Show Preview Tooltip]
        OpenPane[Open Stacking Pane]
        LoadIframe[Load Artifact Iframe]
        Stack[Stack New Pane]
    end

    subgraph "State Management"
        PaneState[Pane Stack State]
        ActiveState[Active Pane State]
        HistoryState[Navigation History]
    end

    Read --> Click
    Read --> Hover
    Hover --> Preview
    Click --> OpenPane
    OpenPane --> LoadIframe
    OpenPane --> PaneState
    Nav --> Stack
    Stack --> ActiveState
    ActiveState --> HistoryState
```

## Bracket Link Resolution

```mermaid
flowchart TD
    Input["[[trigger:content]]"]

    Input --> Parse{Parse Content}

    Parse --> |"URL detected"| URL[External URL]
    Parse --> |"artifactId"| Artifact[Local Artifact]
    Parse --> |"postSlug"| Post[Another Post]

    URL --> Iframe[Load in Iframe]
    Artifact --> Lookup[Lookup Artifact Config]
    Post --> Internal[Internal Navigation]

    Lookup --> Iframe
    Internal --> NewPane[Open as Stacking Pane]
    Iframe --> NewPane
```

## Stacking Panes State

```mermaid
stateDiagram-v2
    [*] --> Empty: Initial Load

    Empty --> SinglePane: Click Bracket Link
    SinglePane --> TwoPanes: Click Another Link
    TwoPanes --> ThreePanes: Click Another Link
    ThreePanes --> TwoPanes: Close Pane
    TwoPanes --> SinglePane: Close Pane
    SinglePane --> Empty: Close Pane

    SinglePane --> SinglePane: Navigate Within Pane
    TwoPanes --> TwoPanes: Focus Different Pane
    ThreePanes --> ThreePanes: Focus Different Pane
```

## Data Sources

```mermaid
graph TB
    subgraph "Content Sources"
        MDX[MDX Files]
        Artifacts[Artifact Configs]
        External[External URLs]
    end

    subgraph "Runtime Data"
        Props[Component Props]
        State[React State]
        URL_Params[URL Parameters]
    end

    subgraph "Output Targets"
        DOM[DOM Updates]
        Iframes[Iframe Sources]
        History[Browser History]
    end

    MDX --> Props
    Artifacts --> Props
    External --> Iframes
    Props --> State
    URL_Params --> State
    State --> DOM
    State --> Iframes
    State --> History
```

## Artifact Types

| Type | Source | Rendering |
|------|--------|-----------|
| `url` | External URL | Iframe |
| `artifact` | Claude Artifact ID | Iframe to claude.site |
| `post` | Internal post slug | Stacking pane with post content |
| `component` | React component | Direct render in pane |
