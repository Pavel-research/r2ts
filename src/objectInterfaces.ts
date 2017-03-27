/**
 * Created by kor on 22/03/17.
 */


export interface CRUDObject<T>{

    persist():Promise<T>
    delete():Promise<T>
    create():Promise<T>
    details():Promise<T>
}
export interface Issue extends CRUDObject<IssueDetails>{

    id: string

    title: string

    comments():PagedCollection<Comment>;

    labels(): PagedCollection<Label>
}
export interface Comment extends CRUDObject<Comment>{
    title: string
}
export interface Label{

}

export interface IssueDetails extends Issue{
    body
}

export interface PagedCollection<T> extends Array<T>{
    all():Promise<T[]>
}
export interface Filter{

    and(f: Filter):Filter
    or(f: Filter): Filter
}
export interface issueFilters{

    hasLabel(l:Label):this
    query(str: string): this
    modifedIsLessThen(d:number): this
}

export interface PagedCollectionWithDetails<D,T extends CRUDObject<D>> extends PagedCollection<T>{

    allDetails():Promise<D[]>
    forEachDetails( c:(d:D)=>void)
    filter(Filter):PagedCollectionWithDetails<D,T>

}
export interface IssuesCollection extends PagedCollectionWithDetails<IssueDetails,Issue>,issueFilters{

}

declare function issues():IssuesCollection


export interface ObjectFilters{

}
issues().hasLabel(null).modifedIsLessThen(1).query("a").filter(x=>1).forEachDetails(x=>{
    console.log(x.body)
})