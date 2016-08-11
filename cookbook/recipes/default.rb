#
# Cookbook Name:: turnstile
# Recipe:: default
#
# Copyright (C) 2016 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#

#######################
## Install NodeJS 4.x
#
##
include_recipe 'apt::default'

apt_repository 'nodejs-4x' do
  uri 'https://deb.nodesource.com/node_4.x'
  distribution node['lsb']['codename']
  components ['main']
  key 'https://deb.nodesource.com/gpgkey/nodesource.gpg.key'
end

package 'nodejs'
#######################

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

directory node['turnstile']['paths']['directory'] do
  owner node['turnstile']['user']
  group node['turnstile']['group']
  mode '0755'

  recursive true
end

## Fetch and install turnstile
remote_file 'turnstile' do
  source Turnstile::Helpers.github_download('rapid7', 'turnstile', node['turnstile']['version'])
  path ::File.join(Chef::Config['file_cache_path'], "turnstile-#{node['turnstile']['version']}.deb")

  action :create_if_missing
  backup false
end

package 'turnstile' do
  source resources('remote_file[turnstile]').path
  provider Chef::Provider::Package::Dpkg
end

## Upstart Service
template '/etc/init/turnstile.conf' do
  owner node['turnstile']['user']
  group node['turnstile']['group']

  source 'upstart.conf.erb'
  variables(
    :description => 'turnstile configuration service',
    :user => node['turnstile']['user'],
    :executable => node['turnstile']['paths']['executable'],
    :flags => [
      "-c #{node['turnstile']['paths']['configuration']}"
    ]
  )
end

directory 'turnstile-configuration-directory' do
  path ::File.dirname(node['turnstile']['paths']['configuration'])

  owner node['turnstile']['user']
  group node['turnstile']['group']
  mode '0755'

  recursive true
end

template 'turnstile-configuration' do
  path node['turnstile']['paths']['configuration']
  source 'json.erb'

  owner node['turnstile']['user']
  group node['turnstile']['group']

  variables(:properties => node['turnstile']['config'])
end

service 'turnstile' do
  ## The wrapping cookbook must call `action` on this resource to start/enable
  action :nothing

  provider Chef::Provider::Service::Upstart
end
