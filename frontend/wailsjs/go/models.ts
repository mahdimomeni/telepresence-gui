export namespace models {
	
	export class ClientSession {
	    session_id: string;
	    manager_install_id: string;
	    install_id: string;
	
	    static createFrom(source: any = {}) {
	        return new ClientSession(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.session_id = source["session_id"];
	        this.manager_install_id = source["manager_install_id"];
	        this.install_id = source["install_id"];
	    }
	}
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
	export class DetachConfig {
	    attachment_name: string;
	    namespace: string;
	
	    static createFrom(source: any = {}) {
	        return new DetachConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.attachment_name = source["attachment_name"];
	        this.namespace = source["namespace"];
	    }
	}
	export class InterceptConfig {
	    workload: string;
	    port: string;
	    env_file: string;
	    env_json: string;
	    env_syntax: string;
	    http_header: string;
	    mount: string;
	    container: string;
	    service: string;
	    docker_run: boolean;
	    docker_args: string;
	
	    static createFrom(source: any = {}) {
	        return new InterceptConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workload = source["workload"];
	        this.port = source["port"];
	        this.env_file = source["env_file"];
	        this.env_json = source["env_json"];
	        this.env_syntax = source["env_syntax"];
	        this.http_header = source["http_header"];
	        this.mount = source["mount"];
	        this.container = source["container"];
	        this.service = source["service"];
	        this.docker_run = source["docker_run"];
	        this.docker_args = source["docker_args"];
	    }
	}
	export class Timestamp {
	    seconds: number;
	    nanos: number;
	
	    static createFrom(source: any = {}) {
	        return new Timestamp(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.seconds = source["seconds"];
	        this.nanos = source["nanos"];
	    }
	}
	export class InterceptSpec {
	    name: string;
	    client: string;
	    agent: string;
	    workload_kind: string;
	    namespace: string;
	    mechanism: string;
	    target_host: string;
	    port_identifier: string;
	    service_port_name: string;
	    service_port: number;
	    service_uid: string;
	    protocol: string;
	    container_name: string;
	    container_port: number;
	    target_port: number;
	    roundtrip_latency: number;
	    dial_timeout: number;
	    replace: boolean;
	    wiretap: boolean;
	    no_default_port: boolean;
	    header_filters: Record<string, string>;
	    plaintext: boolean;
	    node_agent: boolean;
	
	    static createFrom(source: any = {}) {
	        return new InterceptSpec(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.client = source["client"];
	        this.agent = source["agent"];
	        this.workload_kind = source["workload_kind"];
	        this.namespace = source["namespace"];
	        this.mechanism = source["mechanism"];
	        this.target_host = source["target_host"];
	        this.port_identifier = source["port_identifier"];
	        this.service_port_name = source["service_port_name"];
	        this.service_port = source["service_port"];
	        this.service_uid = source["service_uid"];
	        this.protocol = source["protocol"];
	        this.container_name = source["container_name"];
	        this.container_port = source["container_port"];
	        this.target_port = source["target_port"];
	        this.roundtrip_latency = source["roundtrip_latency"];
	        this.dial_timeout = source["dial_timeout"];
	        this.replace = source["replace"];
	        this.wiretap = source["wiretap"];
	        this.no_default_port = source["no_default_port"];
	        this.header_filters = source["header_filters"];
	        this.plaintext = source["plaintext"];
	        this.node_agent = source["node_agent"];
	    }
	}
	export class InterceptInfo {
	    spec: InterceptSpec;
	    id: string;
	    client_session: ClientSession;
	    disposition: number;
	    pod_name: string;
	    api_port: number;
	    pod_ip: string;
	    sftp_port: number;
	    ftp_port: number;
	    mount_point: string;
	    mechanism_args_desc: string;
	    environment: Record<string, string>;
	    mounts: Record<string, number>;
	    modified_at: Timestamp;
	
	    static createFrom(source: any = {}) {
	        return new InterceptInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.spec = this.convertValues(source["spec"], InterceptSpec);
	        this.id = source["id"];
	        this.client_session = this.convertValues(source["client_session"], ClientSession);
	        this.disposition = source["disposition"];
	        this.pod_name = source["pod_name"];
	        this.api_port = source["api_port"];
	        this.pod_ip = source["pod_ip"];
	        this.sftp_port = source["sftp_port"];
	        this.ftp_port = source["ftp_port"];
	        this.mount_point = source["mount_point"];
	        this.mechanism_args_desc = source["mechanism_args_desc"];
	        this.environment = source["environment"];
	        this.mounts = source["mounts"];
	        this.modified_at = this.convertValues(source["modified_at"], Timestamp);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class KubeInfo {
	    currentContext: string;
	    contexts: string[];
	    namespace: string;
	    kubeconfigPath: string;
	    savedConfig?: ConnectConfig;
	
	    static createFrom(source: any = {}) {
	        return new KubeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentContext = source["currentContext"];
	        this.contexts = source["contexts"];
	        this.namespace = source["namespace"];
	        this.kubeconfigPath = source["kubeconfigPath"];
	        this.savedConfig = this.convertValues(source["savedConfig"], ConnectConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Workload {
	    name: string;
	    namespace: string;
	    workload_resource_type: string;
	    uid: string;
	    desired_replicas: number;
	    ready_replicas: number;
	    agent_version?: string;
	    not_interceptable_reason?: string;
	    intercept_info?: InterceptInfo[];
	
	    static createFrom(source: any = {}) {
	        return new Workload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.workload_resource_type = source["workload_resource_type"];
	        this.uid = source["uid"];
	        this.desired_replicas = source["desired_replicas"];
	        this.ready_replicas = source["ready_replicas"];
	        this.agent_version = source["agent_version"];
	        this.not_interceptable_reason = source["not_interceptable_reason"];
	        this.intercept_info = this.convertValues(source["intercept_info"], InterceptInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace options {
	
	export class SecondInstanceData {
	    Args: string[];
	    WorkingDirectory: string;
	
	    static createFrom(source: any = {}) {
	        return new SecondInstanceData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Args = source["Args"];
	        this.WorkingDirectory = source["WorkingDirectory"];
	    }
	}

}

export namespace services {
	
	export class UpdateInfo {
	    available: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    releaseNotes: string;
	    publishedAt: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseNotes = source["releaseNotes"];
	        this.publishedAt = source["publishedAt"];
	        this.url = source["url"];
	    }
	}

}

