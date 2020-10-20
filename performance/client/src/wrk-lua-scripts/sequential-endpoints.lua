--[[
This program and the accompanying materials are made available under the terms of the
Eclipse Public License v2.0 which accompanies this distribution, and is available at
https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright IBM Corporation 2020
--]]

JSON = (loadfile "JSON.lua")() -- one-time load of the routines

-- Initialize the pseudo random number generator - http://lua-users.org/wiki/MathLibraryTutorial
math.randomseed(os.time())
math.random(); math.random(); math.random()

-- parameters will be passed from preparing step
debug = {{debug}}
json_file = "endpoints.json"

-- check if file exists on the file system
function file_exists(file)
  local f = io.open(file, "rb")
  if f then f:close() end
  return f ~= nil
end

-- read full file content and return as string
function read_file_content(file)
  lines = {}
  for line in io.lines(file) do
    lines[#lines + 1] = line
  end
  return table.concat(lines, "\n")
end

-- read all http requests defined in the json file
if not file_exists(json_file) then
  io.stderr:write("Error: file " .. json_file .. " doesn't exist\n")
  os.exit()
end
local endpoints_text = read_file_content(json_file)
local endpoints = JSON:decode(endpoints_text)
if #endpoints <= 0 then
  io.stderr:write("Error: no paths found in " .. json_file .. "\n")
  os.exit()
end
if debug then
  io.write("[debug]------------------------------\n")
  io.write("[debug] total endpoints: " .. #endpoints .. "\n")
end
-- sort endpoints by sequence
table.sort(endpoints, function(a, b)
  return a.sequence < b.sequence
end)

-- threads listing
local thread_counter = 1
local all_threads = {}

function setup(thread)
  thread:set("id", thread_counter)
  table.insert(all_threads, thread)
  thread_counter = thread_counter + 1
end

function init(args)
  -- pointer should be per thread
  pointer  = 1
end

-- handle wrk request, process endpoints one by one
function request()
  local selected_request = endpoints[pointer]

  local path = "/"
  if selected_request.endpoint ~= nil then
    path = selected_request.endpoint
  end

  local method = "GET"
  if selected_request.method ~= nil then
    method = selected_request.method
  end

  local headers = {}
  for key, value in pairs(wrk.headers) do
    headers[key] = value
  end
  if selected_request.headers ~= nil and type(selected_request.headers) == "table" then
    for key, value in pairs(selected_request.headers) do
      headers[key] = value
    end
  end

  local body = ""
  if selected_request.body ~= nil then
    body = selected_request.body
  end

  if debug then
    io.write("[debug][thread#" .. id .. "]>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n")
    io.write("[debug][thread#" .. id .. "][request] " .. method .. " " .. wrk.scheme .. "://" .. wrk.host .. ":" .. wrk.port .. path .. "\n")
    io.write("[debug][thread#" .. id .. "][request] Headers:\n")
    for key, value in pairs(headers) do
      io.write("[debug][thread#" .. id .. "][request]  - " .. key  .. ": " .. value .. "\n")
    end
    io.write("[debug][thread#" .. id .. "][request] Body: " .. body .. "\n")
  end

  -- move pointer to next request
  pointer = pointer + 1
  if pointer > #endpoints then
    pointer = 1
  end

  return wrk.format(method, path, headers, body)
end

-- debug http response
function response(status, headers, body)
  if debug then
    io.write("[debug][thread#" .. id .. "]<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n")
    io.write("[debug][thread#" .. id .. "][response] Status: " .. status .. "\n")

    io.write("[debug][thread#" .. id .. "][response] Headers:\n")

    -- Loop through passed arguments
    for key, value in pairs(headers) do
      io.write("[debug][thread#" .. id .. "][response]  - " .. key  .. ": " .. value .. "\n")
    end

    io.write("[debug][thread#" .. id .. "][response] Body:\n")
    io.write("[debug][thread#" .. id .. "][response] " .. body .. "\n")
  end
end
