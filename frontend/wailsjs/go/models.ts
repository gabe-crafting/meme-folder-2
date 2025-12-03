export namespace main {
	
	export class Favorite {
	    path: string;
	    name: string;
	    addedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Favorite(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.addedAt = source["addedAt"];
	    }
	}
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
	export class Settings {
	    videoMemoryLimitMB: number;
	    imageMemoryLimitMB: number;
	    customConfigPath: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.videoMemoryLimitMB = source["videoMemoryLimitMB"];
	        this.imageMemoryLimitMB = source["imageMemoryLimitMB"];
	        this.customConfigPath = source["customConfigPath"];
	    }
	}
	export class UIState {
	    lastPath: string;
	    foldersCollapsed: boolean;
	    showTags: boolean;
	    showOnlyUntagged: boolean;
	    sidebarOpen: boolean;
	    hideInactiveTags: boolean;
	    tagFilterIntersect: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UIState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lastPath = source["lastPath"];
	        this.foldersCollapsed = source["foldersCollapsed"];
	        this.showTags = source["showTags"];
	        this.showOnlyUntagged = source["showOnlyUntagged"];
	        this.sidebarOpen = source["sidebarOpen"];
	        this.hideInactiveTags = source["hideInactiveTags"];
	        this.tagFilterIntersect = source["tagFilterIntersect"];
	    }
	}

}

