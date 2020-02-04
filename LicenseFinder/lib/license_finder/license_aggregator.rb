# frozen_string_literal: true

module LicenseFinder
  class LicenseAggregator
    def initialize(config, aggregate_paths)
      @config = config
      @aggregate_paths = aggregate_paths
    end

    def dependencies
      aggregate_packages
    end

    def any_packages?
      finders.map do |finder|
        finder.prepare_projects if @config.prepare
        finder.any_packages?
      end.reduce(:|)
    end

    def unapproved
      aggregate_packages.reject(&:approved?)
    end

    def blacklisted
      aggregate_packages.select(&:blacklisted?)
    end

    private

    def finders
      return @finders unless @finders.nil?

      @finders = if @aggregate_paths.nil?
                   [LicenseFinder::Core.new(@config)]
                 else
                   @aggregate_paths.map do |path|
                     # Passing file paths as values instead of allowing them to evaluate in config
                     LicenseFinder::Core.new(@config.merge(project_path: path,
                                                           log_directory: @config.log_directory || @config.project_path,
                                                           decisions_file: @config.decisions_file_path))
                   end
                 end
    end

    def aggregate_packages
      return @packages unless @packages.nil?

      all_packages = finders.flat_map do |finder|
        finder.prepare_projects if @config.prepare
        finder.acknowledged.map { |dep| MergedPackage.new(dep, [finder.project_path]) }
      end
      @packages = all_packages.group_by { |package| [package.name, package.version] }
                              .map do |_, packages|
        MergedPackage.new(packages[0].dependency, packages.flat_map(&:aggregate_paths))
      end

      #####################################################################################
      # FIXES ADDED BY JACK JIA
      zowe_extra_fixes
    end

    #####################################################################################
    # FIXES ADDED BY JACK JIA
    # license should be short_name defined in LicenseFinder/lib/license_finder/license/definitions.rb
    ZOWE_FIXES = {
      "org.sonatype.oss:oss-parent:7": {
        homepage: "https://mvnrepository.com/artifact/org.sonatype.oss/oss-parent/7",
        licenses: ["Apache2"]
      },
      "javax.servlet:servlet-api:2.5": {
        homepage: "https://mvnrepository.com/artifact/javax.servlet/servlet-api/2.5",
        licenses: ["GPLv2"]
      },
      "javax.xml.stream:stax-api:1.0-2": {
        homepage: "https://mvnrepository.com/artifact/javax.xml.stream/stax-api/1.0-2",
        licenses: ["GPLv2"]
      },
      "fsevents:1.2.9": {
        licenses: ["MIT"]
      },
      "fsevents:1.2.11": {
        licenses: ["MIT"]
      },
      "cycle:1.0.3": {
        licenses: ["CC01"]
      },
      "buffers:0.1.1": {
        licenses: ["MIT"]
      },
      "taffydb:2.6.2": {
        licenses: ["BSD-2-Clause"]
      },
    }
    
    def zowe_extra_fixes
      @packages.map do |package|
        # ==========
        # check some common failure
        # 1. homepage doesn't start with http
        begin
          if !package.dependency.homepage.empty? && !package.dependency.homepage.start_with?("http://", "https://")
            package.dependency.homepage.prepend("http://")
          end
        end

        # ==========
        # check pre-defined dependency fixes
        package_key = "#{package.name}:#{package.version}".to_sym
        if ZOWE_FIXES.has_key?(package_key)
          package.dependency.logger.info "[zowe_extra_fixes] found", " #{package_key}", color: :green
          # puts package.inspect
          if ZOWE_FIXES[package_key].has_key?(:homepage)
            package.dependency.logger.info "[zowe_extra_fixes] - update homepage to", "#{ZOWE_FIXES[package_key][:homepage]}", color: :green
            package.dependency.homepage = ZOWE_FIXES[package_key][:homepage]
          end
          if ZOWE_FIXES[package_key].has_key?(:licenses)
            package.dependency.logger.info "[zowe_extra_fixes] - update licenses to", "#{ZOWE_FIXES[package_key][:licenses]}", color: :green
            package.dependency.licenses.clear()
            ZOWE_FIXES[package_key][:licenses].each { |license_name|
              package.dependency.licenses.add(License.find_by_name(license_name))
            }
          end
          # puts package.inspect
        end

        package
      end
    end
  end
end
