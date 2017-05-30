build_name 'turnstile'

autoversion.create_tags false
autoversion.search_tags false

cookbook.depends 'turnstile' do |turnstile|
  turnstile.path './cookbook'
end

profile :default do |default|
  default.chef.run_list ['turnstile::nodejs', 'turnstile::default']
end
