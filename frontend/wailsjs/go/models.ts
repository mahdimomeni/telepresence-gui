export namespace main {
	
	export class ConnectConfig {
	    namespace: string;
	    name: string;
	    "manager-namespace": string;
	    docker: boolean;
	    "mapped-namespaces": string;
	    "proxy-via": string;
	    "also-proxy": string;
	    "never-proxy": string;
	    "reroute-local": string;
	    "reroute-remote": string;
	    vnat: string;
	    "allow-conflicting-subnets": string;
	    expose: string;
	    hostname: string;
	    kubeconfig: string;
	    context: string;
	    cluster: string;
	    server: string;
	    token: string;
	    user: string;
	    as: string;
	    "as-group": string;
	    "as-uid": string;
	    "client-certificate": string;
	    "client-key": string;
	    "insecure-skip-tls-verify": boolean;
	    "tls-server-name": string;
	    config: string;
	    "request-timeout": string;
	    "disable-compression": boolean;
	
	    static createFrom(source: any = {}) {
	        return new ConnectConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.namespace = source["namespace"];
	        this.name = source["name"];
	        this["manager-namespace"] = source["manager-namespace"];
	        this.docker = source["docker"];
	        this["mapped-namespaces"] = source["mapped-namespaces"];
	        this["proxy-via"] = source["proxy-via"];
	        this["also-proxy"] = source["also-proxy"];
	        this["never-proxy"] = source["never-proxy"];
	        this["reroute-local"] = source["reroute-local"];
	        this["reroute-remote"] = source["reroute-remote"];
	        this.vnat = source["vnat"];
	        this["allow-conflicting-subnets"] = source["allow-conflicting-subnets"];
	        this.expose = source["expose"];
	        this.hostname = source["hostname"];
	        this.kubeconfig = source["kubeconfig"];
	        this.context = source["context"];
	        this.cluster = source["cluster"];
	        this.server = source["server"];
	        this.token = source["token"];
	        this.user = source["user"];
	        this.as = source["as"];
	        this["as-group"] = source["as-group"];
	        this["as-uid"] = source["as-uid"];
	        this["client-certificate"] = source["client-certificate"];
	        this["client-key"] = source["client-key"];
	        this["insecure-skip-tls-verify"] = source["insecure-skip-tls-verify"];
	        this["tls-server-name"] = source["tls-server-name"];
	        this.config = source["config"];
	        this["request-timeout"] = source["request-timeout"];
	        this["disable-compression"] = source["disable-compression"];
	    }
	}
	export class KubeInfo {
	    currentContext: string;
	    contexts: string[];
	    namespace: string;
	    kubeconfigPath: string;
	
	    static createFrom(source: any = {}) {
	        return new KubeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentContext = source["currentContext"];
	        this.contexts = source["contexts"];
	        this.namespace = source["namespace"];
	        this.kubeconfigPath = source["kubeconfigPath"];
	    }
	}

}

