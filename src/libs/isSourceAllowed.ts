
export function getAllowedSourcePrefixes(env:string){ 
    return [
        `rds:db-${env}-test`
    ]
}