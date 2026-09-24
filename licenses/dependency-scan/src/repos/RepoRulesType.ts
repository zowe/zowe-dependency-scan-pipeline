export type RepoRulesType = { 
  [key: string]: RepoRule;
}

export type RepoRule = {
    excludes?: {
        packages?: {
            id: string,
            reason: string,
            comment: string,
        }[],
        paths?: {
            pattern: string,
            reason: string,
            comment: string,
        }[],
        scopes?: {
            pattern: string,
            reason: string,
            comment: string,
        }[],
    },
    analyzer?: any, // see ort spec
    toolsEnabled?: string[]
}