export interface _CLIENT_INTERFACE {
    organization: githubTypes_OrganizationService
}
export interface Collection<T> {
    count(): number
    all(): Promise<T[]>
    forEach(f: (c: T) => void): void
    map<A>(f: (c: T) => A): Collection<A>
    filter(options: any): Collection<T>
    sort(options: any): Collection<T>
}
export interface githubTypes_HasId {
    id: number
}

export interface githubTypes_Organization extends githubTypes_HasId {
    login: string

    description: string

    repos(): Collection<githubTypes_Repository>

    members(): Collection<githubTypes_User>
}

export interface githubTypes_Repository extends githubTypes_HasId {
    name: string

    full_name: string

    description: string

    milestones(): Collection<githubTypes_Milestone>

    labels(): Collection<githubTypes_Label>

    issues(): Collection<githubTypes_Issue>

    post(body: githubTypes_CreateIssue): githubTypes_Issue
}

export interface githubTypes_User {
    login: string
}

export interface githubTypes_Milestone extends githubTypes_HasId {
    number: number

    title: string
}

export interface githubTypes_Label extends githubTypes_HasId {
    name: string
}

export interface githubTypes_Base extends githubTypes_HasId {
    created_at: string

    updated_at: string

    body?: string
}

export interface githubTypes_Issue extends githubTypes_Base {
    number: string

    title: string

    labels: githubTypes_Label[]

    milestone?: githubTypes_Milestone

    state: string

    repository: githubTypes_Repository

    comments(): Collection<githubTypes_Comment>

    patch(body: githubTypes_EditIssue): githubTypes_Issue
}

export interface githubTypes_CreateIssue {
    title: string

    milestone?: number

    labels: string[]

    body?: string
}

export interface githubTypes_EditIssue extends githubTypes_CreateIssue {
    state: string
}

export interface githubTypes_Comment extends githubTypes_Base {
}

export interface githubTypes_OrganizationService {
    getUserOrgs(): githubTypes_Organization
}

declare function require(v: string): any
export function client(options: any): _CLIENT_INTERFACE {
    var module = require('./types.ts');
    var rtb: any = require('raml-type-bindings');
    return rtb.createClient(module, options)
}
        