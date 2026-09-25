export type RepoRulesType = { 
  [key: string]: RepoRule;
}

export type RepoRule = {
    excludes: {
        paths?: {
            pattern: string,
            reason: string,
            comment: string,
        }[]
        scopes?: {
            pattern: string,
            reason: string,
            comment: string,
        }[]
    },
    analyzer?: any, // see ort spec
    toolsEnabled?: string[]
}