#
# Cookbook Name:: turnstile
# Recipe:: default
#
# Copyright (C) 2017 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#

node.default['turnstile']['version'] = cookbook_version

group node['turnstile']['group'] do
  system true
end

user node['turnstile']['user'] do
  comment 'turnstile operator'
  system true

  gid node['turnstile']['group']
  home node['turnstile']['paths']['directory']
end

version_dir = "#{ node['turnstile']['paths']['directory'] }-#{ node['turnstile']['version'] }"

# Install packages if running in local install mode
execute 'npm install' do
  command 'npm install'
  cwd version_dir
  environment 'HOME' => version_dir

  notifies :create, "link[#{node['turnstile']['paths']['directory']}]", :immediately
end if node['turnstile']['install'].to_sym == :local

if node['turnstile']['install'].to_sym != :local
  # If we're not running in local mode (using synced folders) we download
  # and install the named release from Github
  remote_file 'turnstile' do
    source Turnstile::Helpers.github_download('rapid7', 'turnstile', node['turnstile']['version'])
    path ::File.join(Chef::Config['file_cache_path'], "turnstile-#{node['turnstile']['version']}.deb")

    action :create_if_missing
    backup false
  end

  package 'turnstile' do
    source resources('remote_file[turnstile]').path
    provider Chef::Provider::Package::Dpkg
    version node['turnstile']['version']

    notifies :create, "link[#{node['turnstile']['paths']['directory']}]", :immediately
  end
end
## Fetch and install Turnstile

link node['turnstile']['paths']['directory'] do
  to "#{ node['turnstile']['paths']['directory'] }-#{ node['turnstile']['version'] }"

  action :nothing
  notifies :restart, 'service[turnstile]' if node['turnstile']['enable']
end

## Upstart Service
template '/etc/init/turnstile.conf' do
  source 'upstart.conf.erb'
  variables(
    :description => 'turnstile configuration service',
    :user => node['turnstile']['user'],
    :executable => node['turnstile']['paths']['executable'],
    :flags => [
      "-c #{node['turnstile']['paths']['configuration']}"
    ]
  )

  notifies :restart, 'service[turnstile]' if node['turnstile']['enable']
end

directory 'turnstile-configuration-directory' do
  path ::File.dirname(node['turnstile']['paths']['configuration'])
  mode '0755'

  recursive true
end

template 'turnstile-configuration' do
  path node['turnstile']['paths']['configuration']
  source 'json.erb'

  variables :properties => node['turnstile']['config']

  notifies :restart, 'service[turnstile]' if node['turnstile']['enable']
end

service 'turnstile' do
  action node['turnstile']['enable'] ? [:start, :enable] : [:stop, :disable]
  provider Chef::Provider::Service::Upstart
end
