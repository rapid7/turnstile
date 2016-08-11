build_name 'turnstile'

autoversion.create_tags false
autoversion.search_tags false

cookbook.depends 'turnstile' do |turnstile|
  turnstile.path './cookbook'
end

profile :default do |test|
  test.chef.run_list 'turnstile::default'
end
