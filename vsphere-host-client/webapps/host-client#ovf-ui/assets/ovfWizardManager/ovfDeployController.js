/**
 * JS file that initializes and holds the ovf wizard data.
 */

/**
 * Main controller.
 * Contains data for the wizard to populate the steps and load templates.
 * shows and hides the wizard.
 */
function OvfDeployController($scope, $http){
   angular.extend($scope,{
      wizard: {
         wizardData: {
            acceptEula: false,
            eulaUrl: "ovf-ui/assets/ovfWizardPages/eulaText.html",
            ovfSource: '',
            ovfSourceLocalPath:'',
            localFileSourceSet: false,
            migrationFlag: false,
            showProgress:false,
            progressClose: false,
            probeData: {},
            profileLayout: {},
            ebValue:'',
            vmNames: [],
            ssoType: '',
            ebServerGuid:'',
            networkFamily: ["ipv4", "ipv6"],
            ipv4Modes: ["static","dhcp"],
            ipv6Modes: ["static","dhcp", "autoconf"],
            ovfVar: {
               pluginId: null,
               objectId: null,
               ticket: null,
               targetHost: null,
               opt: []
            },
            progress: {
               percent: {width:'0%'},
               text: null,
               vmRef: null
            },
            preupgradeCheckData: {},
            ovfOptions: {
               vmName: null,
               sshEnabled: false,
               nodeType: "embedded",
               migrationData: {
                  vpxdUser:'',
                  vpxdPassword:'',
                  vpxdIp:'',
                  guestUser:'',
                  guestPassword:'',
                  guestThumbprint:'',
                  hostIp:'',
                  hostUser:'',
                  hostPassword:'',
                  optionalBitsFlag:'',
                  optionalBits: [],
                  exportPath: ''
               },
               datastoreData: {
                  diskMode:'thick',
                  moRef:''
               },
               passwordData: {
                  rootPassword:'',
                  vmdirPassword:'',
                  vmdirDomainName:''
               },
               databaseData: {
                  dbType:'embedded',
                  dbUsername:'',
                  dbPassword:'',
                  dbServerName:'',
                  dbServerPort:'',
                  dbInstance:''
               },
               networkData: {
                  netAddrFamily: "ipv4",
                  netMode: "dhcp",
                  hostName: '',
                  nwMoRef: null,
                  netAddr: '',
                  netPrefix:'',
                  netGateway:'',
                  dnsServerNames:'',
                  ntpServerNames: '',
                  timeSyncType: 'ntp'
               },
               portData: {
                  httpPort: '0',
                  httpsPort: '0',
                  ldapPort: '0',
                  vcServerPort: '0',
                  netdumpPort: '0',
                  autodeployPort: '0'
               },
               internalPorts: [],
               externalPorts: {
                  "embedded": {},
                  "management": {},
                  "infrastructure": {}
               }
            }
         },
         moreftoString : function(moRef) {
            var prefix;
            if (moRef.type == "DistributedVirtualPortgroup") {
               prefix = "vim.dvs.";
            } else {
               prefix = "vim.";
            }
            return prefix + moRef.type + ":" + moRef.value;
         },
         escapeQuotes :function(str) {
            str = str + '';
            var escStr = str.replace(/\"/g, "'");
            return escStr;
            //return (str + '').replace(/\"/g, "%22");
         },
         onFinish :function() {
            var wizard = $scope.wizard;
            wizard.wizardData.showProgress = true;
         },
         getOptions : function(callback) {
            var wizard = $scope.wizard;
            var ovfOptions = wizard.wizardData.ovfOptions;
            options = ["--I:morefArgs", "--acceptAllEulas", "--powerOn",
                  "--allowExtraConfig", "--X:injectOvfEnv", "--X:waitForIp"];
            options.push("--diskMode=" + ovfOptions.datastoreData.diskMode);
            options.push("--name=" + ovfOptions.vmName);
            options.push("--prop:guestinfo.cis.deployment.node.type=" +
                  ovfOptions.nodeType);
            options.push("--datastore=" +
                  wizard.moreftoString(ovfOptions.datastoreData.moRef));
            options.push("--deploymentOption=" + ovfOptions.sizingData.id);
            // If migration flag is true add migration specific options.
            if(wizard.wizardData.migrationFlag) {
               options.push("--prop:guestinfo.cis.upgrade.source.vpxd.user=" +
                     ovfOptions.migrationData.vpxdUser);
               options.push("--prop:guestinfo.cis.upgrade.source.vpxd.password=" +
                     ovfOptions.migrationData.vpxdPassword);
               options.push("--prop:guestinfo.cis.upgrade.source.vpxd.ip=" +
                     ovfOptions.migrationData.vpxdIp);
               options.push("--prop:guestinfo.cis.upgrade.source.guest.user=" +
                     ovfOptions.migrationData.guestUser);
               options.push("--prop:guestinfo.cis.upgrade.source.guest.password=" +
                     ovfOptions.migrationData.guestPassword);
               options.push("--prop:guestinfo.cis.upgrade.source.guestops.host.addr=" +
                     ovfOptions.migrationData.hostIp);
               options.push("--prop:guestinfo.cis.upgrade.source.guestops.host.user=" +
                     ovfOptions.migrationData.hostUser);
               options.push("--prop:guestinfo.cis.upgrade.source.guestops.host.password=" +
                     ovfOptions.migrationData.hostPassword);
               options.push("--prop:guestinfo.cis.upgrade.source.ssl.thumbprint=" +
                     ovfOptions.migrationData.guestThumbprint);
               options.push("--prop:guestinfo.cis.upgrade.source.export.directory=" +
                     ovfOptions.migrationData.exportPath);
               //options.push("--prop:guestinfo.cis.upgrade.user.options=" +
               //   wizard.escapeQuotes(JSON.stringify(ovfOptions.migrationData.optionalBits)));
               //  Asking upgrade folks to
               // have this pre determined.Depends on the disk sizing options work by Jignesh
               options.push("--prop:guestinfo.cis.upgrade.import.directory=/tmp/cis-export-folder");
            }
            // Enable ssh
            options.push("--prop:guestinfo.cis.appliance.ssh.enabled=" +
                  ovfOptions.sshEnabled);
            // passwords.
            options.push("--prop:guestinfo.cis.appliance.root.passwd=" +
                  ovfOptions.passwordData.rootPassword);
            // Only in case of 5.5 Embeded node migration we have perform magic
            // We would reuse the migration data to set the SSO install param
            // We only need to set the SSO password and domain not site
            if(wizard.wizardData.migrationFlag &&
                  wizard.wizardData.sourceNodeType.value === "55") {
               // We obtian the password of the sso administrator on source vcva
               options.push("--prop:guestinfo.cis.vmdir.password=" +
                     ovfOptions.migrationData.vpxdPassword);
               options.push("--prop:guestinfo.cis.vmdir.domain-name=vsphere.local");
            } else {
               // Management node deployment
               if(ovfOptions.nodeType === "management" && !wizard.wizardData.migrationFlag) {
                  options.push("--prop:guestinfo.cis.vmdir.password=" +
                        ovfOptions.ssoNodeData.ssoPassword);
                  options.push("--prop:guestinfo.cis.vmdir.domain-name=" +
                        ovfOptions.ssoNodeData.ssoDomainName);
                  options.push("--prop:guestinfo.cis.system.vm0.hostname=" +
                        ovfOptions.ssoNodeData.ssoInstanceIp);
               } else  {
                  // Infra or Embedded node deployment
                  // IF SSO replicated from partner host
                  if (wizard.wizardData.ssoType === 'replicate') {
                     options.push("--prop:guestinfo.cis.vmdir.first-instance=false");
                     options.push("--prop:guestinfo.cis.vmdir.replication-partner-hostname="+
                           ovfOptions.ssoPartnerData.ssoInstanceIp);
                     options.push("--prop:guestinfo.cis.vmdir.password=" +
                           ovfOptions.ssoPartnerData.ssoPassword);
                     options.push("--prop:guestinfo.cis.vmdir.domain-name=" +
                           ovfOptions.ssoPartnerData.ssoDomainName);
                     options.push("--prop:guestinfo.cis.vmdir.site-name=" +
                        ovfOptions.ssoPartnerData.ssoSiteName);
                  } else {
                     //  Fresh SSO installation
                     options.push("--prop:guestinfo.cis.vmdir.password=" +
                           ovfOptions.passwordData.ssoPassword);
                     options.push("--prop:guestinfo.cis.vmdir.domain-name=" +
                           ovfOptions.passwordData.ssoDomainName);
                     options.push("--prop:guestinfo.cis.vmdir.site-name=" +
                           ovfOptions.passwordData.ssoSiteName);
                  }
               }
            }
            // Database parameters. No options are set during migration or
            // during infrastructure node installation.
            if (ovfOptions.nodeType !== "infrastructure") {
               options.push("--prop:guestinfo.cis.db.type=" +
                     ovfOptions.databaseData.dbType);
               if(ovfOptions.databaseData.dbType === 'external') {
                  options.push("--prop:guestinfo.cis.db.user=" +
                        ovfOptions.databaseData.dbUsername);
                  options.push("--prop:guestinfo.cis.db.password=" +
                        ovfOptions.databaseData.dbPassword);
                  options.push("--prop:guestinfo.cis.db.servername=" +
                        ovfOptions.databaseData.dbServerName);
                  options.push("--prop:guestinfo.cis.db.instance=" +
                        ovfOptions.databaseData.dbInstance);
                  options.push("--prop:guestinfo.cis.db.serverport=" +
                        ovfOptions.databaseData.dbServerPort);
                  options.push("--prop:guestinfo.cis.db.provider=oracle");
               }
            }
            // Check if the networks can be more than one.
            options.push("--net:Network 1=" +
                  wizard.moreftoString(ovfOptions.networkData.nwMoRef));
            // Networks.
            if(!wizard.wizardData.migrationFlag) {
               options.push("--prop:guestinfo.cis.appliance.net.addr.family=" +
                     ovfOptions.networkData.netAddrFamily);
               options.push("--prop:guestinfo.cis.appliance.net.mode=" +
                     ovfOptions.networkData.netMode);

               if (ovfOptions.networkData.netMode === "static") {
                  options.push("--prop:guestinfo.cis.appliance.net.pnid=" +
                        ovfOptions.networkData.hostName);
                  options.push("--prop:guestinfo.cis.appliance.net.addr=" +
                        ovfOptions.networkData.netAddr);
                  options.push("--prop:guestinfo.cis.appliance.net.prefix=" +
                        ovfOptions.networkData.netPrefix);
                  options.push("--prop:guestinfo.cis.appliance.net.dns.servers=" +
                        ovfOptions.networkData.dnsServerNames);
                  options.push("--prop:guestinfo.cis.appliance.net.gateway=" +
                        ovfOptions.networkData.netGateway);
               } else if(ovfOptions.networkData.netMode === "dhcp" && ovfOptions.networkData.hostName != "") {
                  options.push("--prop:guestinfo.cis.appliance.net.pnid=" +
                        ovfOptions.networkData.hostName);
               }
            }
            // Time sync/NTP parameters
            if (ovfOptions.networkData.timeSyncType === "ntp") {
               options.push("--prop:guestinfo.cis.appliance.ntp.servers=" +
                  ovfOptions.networkData.ntpServerNames);
            } else if(ovfOptions.networkData.timeSyncType === "tools") {
               options.push("--prop:guestinfo.cis.appliance.time.tools-sync=true");
            }
            // Network Service Ports
            //options.push("--prop:guestinfo.cis.appliance.net.ports=" +
            //      wizard.escapeQuotes(JSON.stringify(ovfOptions.portData)));
            // VC Linking info
            // options.push("--prop:guestinfo.cis.appliance.vpxd.linked-mode.peer.host=");
            // options.push("--prop:guestinfo.cis.appliance.vpxd.linked-mode.peer.port=");
            // fetch ticket and SSLthumbprint.
            $http.get("messagebroker/hostdata/properties/" +
                  wizard.wizardData.ovfVar.objectId +
                  "?properties=viSessionTicket,sslThumbprintForOvfTool").success(
               function(result){
                  options.push("--I:targetSessionTicket=" + result.viSessionTicket);
                  options.push("--targetSSLThumbprint="+
                        result.sslThumbprintForOvfTool);
                  callback(options);
               }
            );
         },

      },
      initWizard: function() {
         localeMap = $scope.wizard.localeMap;
         $scope.wizard.pages = [{
               title: localeMap['DeployVcsaEulaPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/eula.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaEulaPage.description']
            },{
               title: localeMap['DeployVcsaInstallTypePage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/installType.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaInstallTypePage.description']
            },{
               title: localeMap['DeployVcsaSetupAppliancePage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/applianceSetup.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaSetupAppliancePage.description']
            },{
               title: localeMap['DeployVcsaMigrationInfoPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/migration.html',
               state: 'SKIPPED',
               description: localeMap['DeployVcsaMigrationInfoPage.description']
            },{
               title: localeMap['DeployVcsaConfigureInfrastructurePage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/infrastructure.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaConfigureInfrastructurePage.description']
            },{
               title: localeMap['DeployVcsaConfigureSSOPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/configureSso.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaConfigureSSOPage.description']
            },{
               title: localeMap['DeployVcsaConnectToSSOPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/connectToSso.html',
               state: 'SKIPPED',
               description: localeMap['DeployVcsaConnectToSSOPage.description']
            },{
               title: localeMap['DeployVcsaConfigPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/size.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaConfigPage.description']
            },{
               title: localeMap['DeployVcsaStoragePage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/datastores.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaStoragePage.description']
            },{
               title: localeMap['DeployVcsaDatabasePage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/databases.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaDatabasePage.description']
            },{
               title: localeMap['DeployVcsaNetworkPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/networks.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaNetworkPage.description']
            },{
               title: localeMap['DeployVcsaSummaryPage.title'],
               url: 'ovf-ui/assets/ovfWizardPages/summary.html',
               state: 'DISABLED',
               description: localeMap['DeployVcsaSummaryPage.description']
         }];
         // Pages index ( update this when a page is added/removed)
         // Index prefixed with the name of html page
         infrastructureIndex = 3;
         migrationIndex = 4;
         configureSsoIndex = 5;
         connectToSsoIndex = 6;
         databaseIndex = 9;

         // Adding watchers
         // Watch for nodetype during fresh installation
         // Skip is changeing state to 'SKIPPPED'
         // Add is changing  state to 'DISABLED'
         $scope.$watch('wizard.wizardData.ovfOptions.nodeType', function(oldVal, newVal) {
            if ($scope.wizard.wizardData.ovfOptions.nodeType === "infrastructure") {
               // 1)Skip database page for infra node deployment
               // 2) Skip connect to SSO page for management and add configureSSO page
               $scope.wizard.pages[configureSsoIndex].state = "DISABLED";
               $scope.wizard.pages[connectToSsoIndex].state = "SKIPPED";
               $scope.wizard.pages[databaseIndex].state = "SKIPPED";
            } else if ($scope.wizard.wizardData.ovfOptions.nodeType === "management") {
               // 1) Add database page , connect to SSO
               // 2) Skip configureSSO page
               $scope.wizard.pages[configureSsoIndex].state = "SKIPPED";
               $scope.wizard.pages[connectToSsoIndex].state = "DISABLED";
               $scope.wizard.pages[databaseIndex].state = "DISABLED";
            } else {
               // 1)Add database page for infra node deployment
               // 2)Skip connect to SSO page for management and add configureSSO page
               $scope.wizard.pages[configureSsoIndex].state = "DISABLED";
               $scope.wizard.pages[connectToSsoIndex].state = "SKIPPED";
               $scope.wizard.pages[databaseIndex].state = "DISABLED";
            }
         });
         function migration55StateChange() {
            $scope.wizard.pages[configureSsoIndex].state = "SKIPPED";
            $scope.wizard.pages[connectToSsoIndex].state = "SKIPPED";
         }
         function commonStateChange() {
            $scope.wizard.pages[configureSsoIndex].state = "DISABLED";
            if($scope.wizard.wizardData.migrationFlag) {
               $scope.wizard.pages[infrastructureIndex].state = "DISABLED";
               $scope.wizard.pages[migrationIndex].state = "SKIPPED";
               $scope.wizard.pages[databaseIndex].state = "SKIPPED";
               if($scope.wizard.wizardData.sourceNodeType.value === "55") {
                  migration55StateChange();
               }
            } else {
               $scope.wizard.pages[infrastructureIndex].state = "SKIPPED";
               $scope.wizard.pages[migrationIndex].state = "DISABLED";
               $scope.wizard.pages[databaseIndex].state = "DISABLED";
            }
         }
         // If migration is selected as install type
         // 1) Skip infrastructure and database page
         // 2) Add migration page
         // 3) Opposite for fresh install
         $scope.$watch('wizard.wizardData.migrationFlag', function(oldVal, newVal) {
            commonStateChange();
         });
         // Skip SSO page for 55 migration
         $scope.$watch('wizard.wizardData.sourceNodeType.value', function(oldVal, newVal) {
           if($scope.wizard.wizardData.sourceNodeType.value === "55" &&
               $scope.wizard.wizardData.migrationFlag) {
               migration55StateChange();
           } else {
            // To handle 50 or 51
            commonStateChange();
           }
         });
      },
      init: function(objectId, pluginId, localeMap) {
         $scope.wizard.wizardData.ovfVar.pluginId = pluginId;
         $scope.wizard.wizardData.ovfVar.objectId = objectId;
         $scope.wizard.localeMap = localeMap;
         $scope.wizard.wizardData.sourceDeploymentTypes = [
               {text:localeMap['DeployVcsaInstallTypePage.50Embedded'],
                     value:"50", type:"embedded"},
               {text:localeMap['DeployVcsaInstallTypePage.51Embedded'],
                     value:"51", type:"embedded"},
               {text:localeMap['DeployVcsaInstallTypePage.55Embedded'],
                     value:"55", type:"embedded"}];
         $scope.wizard.wizardData.sourceNodeType = $scope.wizard.wizardData.sourceDeploymentTypes[0];
         $scope.initWizard();
         $scope.wizard.show = true;
         $scope.wizard.wizardData.ovfVar.ticket = getOvfTicket(pluginId);
         // Get target.
         $http.get('messagebroker/hostdata/properties/' + objectId + '?properties=viLocator').success(
         function(result){
            $scope.wizard.wizardData.ovfVar.targetHost = result.viLocator;
         });
         // Get environmentBrowser.
         $http.get('messagebroker/hostdata/propertiesByRelation/' + objectId +
               '?relation=parent&targetType=ComputeResource&properties=environmentBrowser').success(
         function(result){
            $scope.wizard.wizardData.ebServerGuid = result[0].value.serverGuid;
            $scope.wizard.wizardData.ebValue = result[0].value.value;
         });
         // Get list of VM names
         $http.get('messagebroker/hostdata/propertiesByRelation/' + objectId +
               '?relation=vm&targetType=VirtualMachine&properties=name').success(
            function(result) {
               var names = [];
               for (i in result) {
                  names.push(result[i].value);
               }
               $scope.wizard.wizardData.vmNames = names;
         });
         // Get default external and internal ports and stored them into used ports
         // TODO cgu: to fetch the ports from the ovf and not from UI once
         // we have the json file available in the cloudvm ovf/ova.
         // So this would go after the setupApplicance page.
         $http.get('ovf-ui/assets/ovfWizardManager/port.json').success(
            function(result) {
               var internalPorts = [],
                   commonPorts = {},
                   infrastructurePorts = {},
                   managementPorts = {};
               for (i in result) {
                  var portData = result[i],
                      portDefault = portData != null ? portData.default.toString() : '0',
                      portKey = "DeployVcsaPortPage."+ i,
                      portName = localeMap[portKey];
                  // External Ports
                  // External Ports key is added and all the correponding ports
                  // for the node type are added here.
                  if (portData.hasOwnProperty('external') &&
                        portData.external == true && portData.infrastructure == true &&
                        portData.management == true)  {
                     if (portData.hasOwnProperty('appliance-only')) {
                        if (!portData["appliance-only"]) {
                           $scope.wizard.wizardData.ovfOptions.externalPorts["embedded"][portName] =
                              portData.default;
                           $scope.wizard.wizardData.ovfOptions.externalPorts["infrastructure"][portName] =
                              portData.default;
                           $scope.wizard.wizardData.ovfOptions.externalPorts["management"][portName] =
                              portData.default;
                        }
                     } else {
                        $scope.wizard.wizardData.ovfOptions.externalPorts["embedded"][portName] =
                           portData.default;
                        $scope.wizard.wizardData.ovfOptions.externalPorts["infrastructure"][portName] =
                           portData.default;
                        $scope.wizard.wizardData.ovfOptions.externalPorts["management"][portName] =
                              portData.default;
                     }
                  } else if (portData.hasOwnProperty('external') &&
                        portData.external == true && portData.infrastructure == true &&
                        portData.management == false)  {
                     if (portData.hasOwnProperty('configurable')) {
                        if (portData["configurable"]) {
                           $scope.wizard.wizardData.ovfOptions.externalPorts["embedded"][portName] =
                              portData.default;
                           $scope.wizard.wizardData.ovfOptions.externalPorts["infrastructure"][portName] =
                              portData.default;
                        }
                     } else {
                        $scope.wizard.wizardData.ovfOptions.externalPorts["embedded"][portName] =
                           portData.default;
                        $scope.wizard.wizardData.ovfOptions.externalPorts["infrastructure"][portName] =
                           portData.default;
                     }
                  } else if (portData.hasOwnProperty('external') &&
                        portData.external == true && portData.infrastructure == false &&
                        portData.management == true)  {
                     if (portData.hasOwnProperty('configurable')) {
                        if (portData["configurable"]) {
                           $scope.wizard.wizardData.ovfOptions.externalPorts["embedded"][portName] =
                              portData.default;
                           $scope.wizard.wizardData.ovfOptions.externalPorts["management"][portName] =
                              portData.default;
                        }
                     } else {
                        $scope.wizard.wizardData.ovfOptions.externalPorts["embedded"][portName] =
                           portData.default;
                        $scope.wizard.wizardData.ovfOptions.externalPorts["management"][portName] =
                           portData.default;
                     }
                  }
                  if (portData.hasOwnProperty('external') &&
                        portData.external == false) {
                     // Internal Ports
                     internalPorts.push(portDefault);
                  }
               }
               $scope.wizard.wizardData.ovfOptions.internalPorts = internalPorts;
         });
         // Get profile layouts
         // TODO cgu: to fetch the layout.json from the ovf and not from UI once
         // we have the json file available in the cloudvm ovf/ova.
         $http.get('ovf-ui/assets/ovfWizardManager/layout.json').success(
            function(result) {
               $scope.wizard.wizardData.profileLayout = result;
         });
      }
   });
}
