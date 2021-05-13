# frozen_string_literal: true

module LicenseFinder
  class Yarn < PackageManager
    SHELL_COMMAND = 'yarn licenses list --no-progress --json'

    def possible_package_paths
      [project_path.join('yarn.lock')]
    end

    def current_packages
      cmd = "#{Yarn::SHELL_COMMAND} #{production_flag}"
      suffix = " --cwd #{project_path}" unless project_path.nil?
      cmd += suffix unless suffix.nil?

      stdout, _stderr, status = Cmd.run(cmd)
      return [] unless status.success?

      packages = []
      incompatible_packages = []

      json_strings = stdout.encode('ASCII', invalid: :replace, undef: :replace, replace: '?').split("\n")
      json_objects = json_strings.map { |json_object| JSON.parse(json_object) }

      if json_objects.last['type'] == 'table'
        license_json = json_objects.pop['data']
        packages = packages_from_json(license_json)
      end

      json_objects.each do |json_object|
        match = /(?<name>[\w,\-]+)@(?<version>(\d+\.?)+)/ =~ json_object['data'].to_s
        if match
          package = YarnPackage.new(name, version, spec_licenses: ['unknown'])
          incompatible_packages.push(package)
        end
      end

      packages + incompatible_packages.uniq
    end

    def prepare
      prep_cmd = "#{Yarn.prepare_command} #{production_flag}"
      _stdout, stderr, status = Dir.chdir(project_path) { Cmd.run(prep_cmd) }
      return if status.success?

      log_errors stderr
      raise "Prepare command '#{prep_cmd}' failed" unless @prepare_no_fail
    end

    def self.takes_priority_over
      NPM
    end

    def self.package_management_command
      'yarn'
    end

    def self.prepare_command
      'yarn install'
    end

    private

    def packages_from_json(json_data)
      body = json_data['body']
      head = json_data['head']

      packages = body.map do |json_package|
        Hash[head.zip(json_package)]
      end

      valid_packages = filter_yarn_internal_package(packages)

      valid_packages.map do |package_hash|
        repository_url = package_hash['VendorUrl']
        package_name = package_hash['Name']
	# Zowe specific workarounds
        if repository_url == "Unknown" and not package_name.include? "zowe" 
          repository_url = "https://www.npmjs.com/package/#{package_name}"
        elsif repository_url.include? "github.com"
          repository_url = "https://www.github.com/" + repository_url.split(/github\.com./)[1]
          if repository_url.include? "gizafoundation"
            repository_url = repository_url.sub("gizafoundation", "zowe")
          end
        end
        YarnPackage.new(package_name, package_hash['Version'], spec_licenses: [package_hash['License']],
                                                                       homepage: repository_url)                                                              
      end
    end

    # remove fake package created by yarn [Yarn Bug]
    def filter_yarn_internal_package(all_packages)
      internal_package_pattern = /workspace-aggregator-[a-zA-z0-9]{8}-[a-zA-z0-9]{4}-[a-zA-z0-9]{4}-[a-zA-z0-9]{4}-[a-zA-z0-9]{12}/
      yarn_internal_package = all_packages.find { |package| internal_package_pattern.match(package['Name']) }
      all_packages - [yarn_internal_package]
    end

    def production_flag
      return '' if @ignored_groups.nil?

      @ignored_groups.include?('devDependencies') ? ' --production' : ''
    end
  end
end
