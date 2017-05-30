build_name 'turnstile'

autoversion.create_tags false
autoversion.search_tags false

cookbook.depends 'turnstile' do |turnstile|
  turnstile.path './cookbook'
end

profile :default do |default|
  default.chef.run_list ['turnstile::nodejs', 'turnstile::default']
end

profile :test => Config.profile(:default) do |test|
  require 'json'

  # Set up for testing
  package_json = JSON.parse(::File.read('package.json'))
  app_version = package_json['version']
  app_dir = '/opt/turnstile'

  test.vagrant do |vagrant|
    vagrant.sync :app do |sync|
      sync.path '.'
      sync.destination "#{app_dir}-#{app_version}"
    end
  end
  test.chef.node_attrs({
    :turnstile => {
      :paths => {
        :directory => app_dir
      },
      :version => app_version,
      :install => :local
    }
  })
end
