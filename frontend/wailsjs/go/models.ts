export namespace main {
	
	export class FileEntry {
	    name: string;
	    type: string;
	    size: number;
	    modified: string;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.size = source["size"];
	        this.modified = source["modified"];
	    }
	}

}

